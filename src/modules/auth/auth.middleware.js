import { eq } from "drizzle-orm";
import { verifyAccessToken } from "../../common/utils/jwt.utils.js";
import ApiError from "../../common/utils/api-error.js";
import { db } from "../../common/config/db.js";
import { users } from "../../db/schema/index.js";

export function authenticate(req, _res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Missing or malformed Authorization header");
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.id, role: payload.role };
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Access token expired");
    }
    throw ApiError.unauthorized("Invalid access token");
  }

  next();
}

export async function authenticateAndCheckBan(req, res, next) {
  authenticate(req, res, () => {});

  const [user] = await db
    .select({ isBanned: users.isBanned })
    .from(users)
    .where(eq(users.id, req.user.id))
    .limit(1);

  if (!user) {
    throw ApiError.unauthorized("User not found");
  }

  if (user.isBanned) {
    throw ApiError.forbidden("Account is banned");
  }

  next();
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== "admin") {
    throw ApiError.forbidden("Admin access required");
  }
  next();
}
