import { eq, and, gt, asc, desc, ne, count as drizzleCount } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";
import { db } from "../../common/config/db.js";
import { users, userSessions, otpVerifications } from "../../db/schema/index.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../common/utils/jwt.utils.js";
import { hashValue, compareHash } from "../../common/utils/hash.utils.js";
import { generateOtp } from "../../common/utils/otp.utils.js";
import { sendWelcomeEmail } from "../../common/config/email.js";
import { sendOtpSms } from "../../common/config/twilio.js";
import ApiError from "../../common/utils/api-error.js";

const MAX_SESSIONS = 2;
const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_LIMIT_WINDOW_MINUTES = 10;
const OTP_RATE_LIMIT_MAX = 5;

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function buildTokenPayload(user) {
  return { id: user.id, role: user.role };
}

function refreshExpiresDate() {
  const raw = process.env.JWT_REFRESH_EXPIRES || "30d";
  const match = raw.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const num = parseInt(match[1], 10);
  const unit = match[2];
  const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return new Date(Date.now() + num * ms);
}

async function createSession(userId, { deviceInfo, ipAddress }) {
  const [{ value: sessionCount }] = await db
    .select({ value: drizzleCount() })
    .from(userSessions)
    .where(eq(userSessions.userId, userId));

  if (sessionCount >= MAX_SESSIONS) {
    const [oldest] = await db
      .select({ id: userSessions.id })
      .from(userSessions)
      .where(eq(userSessions.userId, userId))
      .orderBy(asc(userSessions.lastActiveAt))
      .limit(1);

    if (oldest) {
      await db
        .delete(userSessions)
        .where(eq(userSessions.id, oldest.id));
    }
  }

  const tokenPayload = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  const accessToken = generateAccessToken(buildTokenPayload(tokenPayload));
  const refreshToken = generateRefreshToken(buildTokenPayload(tokenPayload));
  const refreshTokenHash = await hashValue(refreshToken);

  await db.insert(userSessions).values({
    userId,
    refreshTokenHash,
    deviceInfo: deviceInfo || null,
    ipAddress: ipAddress || null,
    expiresAt: refreshExpiresDate(),
  });

  return { accessToken, refreshToken };
}

function extractDeviceInfo(req) {
  return {
    deviceInfo: (req.headers["user-agent"] || "").slice(0, 200),
    ipAddress: req.ip || req.connection?.remoteAddress || null,
  };
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    authProvider: user.authProvider,
    role: user.role,
    createdAt: user.createdAt,
  };
}

// ── Google auth ──────────────────────────────────────────

export async function googleAuth(idToken, req) {
  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch {
    throw ApiError.unauthorized("Invalid Google ID token");
  }

  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId))
    .limit(1);

  let isNewUser = false;

  if (!user && email) {
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (user) {
      const newProvider =
        user.authProvider === "google" ? "google" : "both";
      await db
        .update(users)
        .set({
          googleId,
          avatarUrl: picture || user.avatarUrl,
          authProvider: newProvider,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      user = { ...user, googleId, avatarUrl: picture || user.avatarUrl, authProvider: newProvider };
    }
  }

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        name: name || "User",
        email,
        googleId,
        avatarUrl: picture || null,
        authProvider: "google",
        isVerified: true,
      })
      .returning();

    isNewUser = true;
  }

  if (user.isBanned) {
    throw ApiError.forbidden("Account is banned");
  }

  const tokens = await createSession(user.id, extractDeviceInfo(req));

  if (isNewUser && email) {
    sendWelcomeEmail({ to: email, name: user.name }).catch((err) =>
      console.error("[email] welcome email error:", err)
    );
  }

  return { user: sanitizeUser(user), ...tokens };
}

// ── Phone OTP — send ─────────────────────────────────────

export async function sendOtp(phone) {
  const windowStart = new Date(
    Date.now() - OTP_RATE_LIMIT_WINDOW_MINUTES * 60_000
  );

  const [{ value: recentCount }] = await db
    .select({ value: drizzleCount() })
    .from(otpVerifications)
    .where(
      and(
        eq(otpVerifications.phone, phone),
        gt(otpVerifications.createdAt, windowStart)
      )
    );

  if (recentCount >= OTP_RATE_LIMIT_MAX) {
    throw ApiError.badRequest(
      "Too many OTP requests. Please wait before trying again."
    );
  }

  const otp = generateOtp();
  const otpHash = await hashValue(otp);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);

  await db.insert(otpVerifications).values({
    phone,
    otpHash,
    expiresAt,
  });

  await sendOtpSms(phone, otp);

  return { message: "OTP sent successfully" };
}

// ── Phone OTP — verify ───────────────────────────────────

export async function verifyOtp(phone, otp, req) {
  const now = new Date();

  const [otpRow] = await db
    .select()
    .from(otpVerifications)
    .where(eq(otpVerifications.phone, phone))
    .orderBy(desc(otpVerifications.createdAt))
    .limit(1);

  if (!otpRow || otpRow.expiresAt < now) {
    throw ApiError.badRequest("OTP expired or not found. Request a new one.");
  }

  if (otpRow.attempts >= OTP_MAX_ATTEMPTS) {
    throw ApiError.badRequest(
      "OTP has been invalidated due to too many failed attempts"
    );
  }

  const isMatch = await compareHash(otp, otpRow.otpHash);

  if (!isMatch) {
    await db
      .update(otpVerifications)
      .set({ attempts: otpRow.attempts + 1 })
      .where(eq(otpVerifications.id, otpRow.id));

    throw ApiError.badRequest("Invalid OTP");
  }

  await db
    .delete(otpVerifications)
    .where(eq(otpVerifications.id, otpRow.id));

  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);

  let isNewUser = false;

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        name: "User",
        phone,
        authProvider: "phone",
        isVerified: true,
      })
      .returning();

    isNewUser = true;
  }

  if (user.isBanned) {
    throw ApiError.forbidden("Account is banned");
  }

  const tokens = await createSession(user.id, extractDeviceInfo(req));

  if (isNewUser && user.email) {
    sendWelcomeEmail({ to: user.email, name: user.name }).catch((err) =>
      console.error("[email] welcome email error:", err)
    );
  }

  return { user: sanitizeUser(user), ...tokens };
}

// ── Refresh token ────────────────────────────────────────

export async function refresh(rawRefreshToken, req) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  const sessions = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.userId, payload.id));

  let matchedSession = null;
  for (const session of sessions) {
    const match = await compareHash(rawRefreshToken, session.refreshTokenHash);
    if (match) {
      matchedSession = session;
      break;
    }
  }

  if (!matchedSession) {
    throw ApiError.unauthorized("Refresh token not recognized — please login again");
  }

  if (matchedSession.expiresAt < new Date()) {
    await db
      .delete(userSessions)
      .where(eq(userSessions.id, matchedSession.id));
    throw ApiError.unauthorized("Refresh token expired — please login again");
  }

  await db
    .delete(userSessions)
    .where(eq(userSessions.id, matchedSession.id));

  const tokens = await createSession(payload.id, extractDeviceInfo(req));

  return tokens;
}

// ── Logout ───────────────────────────────────────────────

export async function logout(rawRefreshToken, userId) {
  const sessions = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.userId, userId));

  for (const session of sessions) {
    const match = await compareHash(rawRefreshToken, session.refreshTokenHash);
    if (match) {
      await db
        .delete(userSessions)
        .where(eq(userSessions.id, session.id));
      return;
    }
  }
}

// ── Sessions CRUD ────────────────────────────────────────

export async function listSessions(userId) {
  const rows = await db
    .select({
      id: userSessions.id,
      deviceInfo: userSessions.deviceInfo,
      ipAddress: userSessions.ipAddress,
      lastActiveAt: userSessions.lastActiveAt,
      createdAt: userSessions.createdAt,
      expiresAt: userSessions.expiresAt,
    })
    .from(userSessions)
    .where(eq(userSessions.userId, userId))
    .orderBy(desc(userSessions.lastActiveAt));

  return rows;
}

export async function revokeSession(sessionId, userId) {
  const [session] = await db
    .select()
    .from(userSessions)
    .where(
      and(eq(userSessions.id, sessionId), eq(userSessions.userId, userId))
    )
    .limit(1);

  if (!session) {
    throw ApiError.notFound("Session not found");
  }

  await db.delete(userSessions).where(eq(userSessions.id, sessionId));
}

export async function revokeOtherSessions(currentRefreshToken, userId) {
  const sessions = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.userId, userId));

  let currentSessionId = null;

  for (const session of sessions) {
    const match = await compareHash(currentRefreshToken, session.refreshTokenHash);
    if (match) {
      currentSessionId = session.id;
      break;
    }
  }

  if (currentSessionId) {
    await db
      .delete(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          ne(userSessions.id, currentSessionId)
        )
      );
  }
}

// ── Get current user ─────────────────────────────────────

export async function getMe(userId) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return sanitizeUser(user);
}
