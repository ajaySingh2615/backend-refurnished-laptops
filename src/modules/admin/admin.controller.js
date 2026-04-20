import ApiResponse from "../../common/utils/api-response.js";
import * as service from "./admin.service.js";

export async function listUsers(req, res) {
  const data = await service.listUsers({
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    search: req.query.search || "",
    role: req.query.role || "all",
  });
  return ApiResponse.ok(res, "Users", data);
}

export async function banUser(req, res) {
  const data = await service.setBanStatus(req.params.id, req.user.id, {
    isBanned: true,
  });
  return ApiResponse.ok(res, "User banned", data);
}

export async function unbanUser(req, res) {
  const data = await service.setBanStatus(req.params.id, req.user.id, {
    isBanned: false,
  });
  return ApiResponse.ok(res, "User unbanned", data);
}

export async function stats(_req, res) {
  const data = await service.dashboardStats();
  return ApiResponse.ok(res, "Dashboard stats", data);
}
