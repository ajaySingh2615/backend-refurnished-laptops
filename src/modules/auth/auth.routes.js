import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import { authenticateAndCheckBan } from "./auth.middleware.js";

import { googleAuthSchema } from "./dto/google-auth.dto.js";
import { sendOtpSchema } from "./dto/send-otp.dto.js";
import { verifyOtpSchema } from "./dto/verify-otp.dto.js";
import { refreshTokenSchema } from "./dto/refresh-token.dto.js";

import * as ctrl from "./auth.controller.js";

const router = Router();

router.post(
  "/api/auth/google",
  validateDto(googleAuthSchema),
  asyncHandler(ctrl.googleAuth)
);

router.post(
  "/api/auth/phone/send-otp",
  validateDto(sendOtpSchema),
  asyncHandler(ctrl.sendOtp)
);

router.post(
  "/api/auth/phone/verify",
  validateDto(verifyOtpSchema),
  asyncHandler(ctrl.verifyOtp)
);

router.post(
  "/api/auth/refresh",
  validateDto(refreshTokenSchema),
  asyncHandler(ctrl.refreshToken)
);

router.post(
  "/api/auth/logout",
  asyncHandler(authenticateAndCheckBan),
  asyncHandler(ctrl.logout)
);

router.get(
  "/api/auth/sessions",
  asyncHandler(authenticateAndCheckBan),
  asyncHandler(ctrl.listSessions)
);

router.delete(
  "/api/auth/sessions/others",
  asyncHandler(authenticateAndCheckBan),
  asyncHandler(ctrl.revokeOtherSessions)
);

router.delete(
  "/api/auth/sessions/:id",
  asyncHandler(authenticateAndCheckBan),
  asyncHandler(ctrl.revokeSession)
);

router.get(
  "/api/auth/me",
  asyncHandler(authenticateAndCheckBan),
  asyncHandler(ctrl.getMe)
);

export default router;
