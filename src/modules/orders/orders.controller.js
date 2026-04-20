import ApiResponse from "../../common/utils/api-response.js";
import * as service from "./orders.service.js";

export async function listMine(req, res) {
  const data = await service.listMine(req.user.id, req.validatedQuery || {});
  return ApiResponse.ok(res, "My orders", data);
}

export async function getMine(req, res) {
  const data = await service.getMine(req.user.id, req.params.id);
  return ApiResponse.ok(res, "Order", data);
}

export async function cancelMine(req, res) {
  const data = await service.cancelOrder(req.params.id, req.user.id, {
    reason: req.body?.reason,
    asOwner: req.user.id,
    asAdmin: false,
  });
  return ApiResponse.ok(res, "Order cancelled", data);
}

export async function adminList(req, res) {
  const data = await service.adminList(req.validatedQuery || {});
  return ApiResponse.ok(res, "Orders", data);
}

export async function adminGet(req, res) {
  const data = await service.adminGet(req.params.id);
  return ApiResponse.ok(res, "Order", data);
}

export async function adminUpdateStatus(req, res) {
  const data = await service.updateStatus(req.params.id, req.body.status);
  return ApiResponse.ok(res, "Status updated", data);
}

export async function adminCancel(req, res) {
  const data = await service.cancelOrder(req.params.id, req.user.id, {
    reason: req.body?.reason,
    asAdmin: true,
  });
  return ApiResponse.ok(res, "Order cancelled", data);
}
