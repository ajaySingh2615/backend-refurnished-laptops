import ApiResponse from "../../common/utils/api-response.js";
import * as authService from "./auth.service.js";

export async function googleAuth(req, res) {
  const { idToken } = req.body;
  const data = await authService.googleAuth(idToken, req);
  return ApiResponse.ok(res, "Google authentication successful", data);
}

export async function sendOtp(req, res) {
  const { phone } = req.body;
  const data = await authService.sendOtp(phone);
  return ApiResponse.ok(res, data.message);
}

export async function verifyOtp(req, res) {
  const { phone, otp } = req.body;
  const data = await authService.verifyOtp(phone, otp, req);
  return ApiResponse.ok(res, "Phone verification successful", data);
}

export async function refreshToken(req, res) {
  const { refreshToken } = req.body;
  const data = await authService.refresh(refreshToken, req);
  return ApiResponse.ok(res, "Token refreshed", data);
}

export async function logout(req, res) {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken, req.user.id);
  return ApiResponse.ok(res, "Logged out successfully");
}

export async function listSessions(req, res) {
  const sessions = await authService.listSessions(req.user.id);
  return ApiResponse.ok(res, "Active sessions", sessions);
}

export async function revokeSession(req, res) {
  await authService.revokeSession(req.params.id, req.user.id);
  return ApiResponse.ok(res, "Session revoked");
}

export async function revokeOtherSessions(req, res) {
  const { refreshToken } = req.body;
  await authService.revokeOtherSessions(refreshToken, req.user.id);
  return ApiResponse.ok(res, "All other sessions revoked");
}

export async function getMe(req, res) {
  const user = await authService.getMe(req.user.id);
  return ApiResponse.ok(res, "Current user", user);
}
