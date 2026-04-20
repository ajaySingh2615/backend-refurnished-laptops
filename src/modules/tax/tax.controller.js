import ApiResponse from "../../common/utils/api-response.js";
import * as service from "./tax.service.js";

export async function listPublic(_req, res) {
  const rows = await service.listActive();
  return ApiResponse.ok(res, "Tax rates", rows);
}

export async function adminList(_req, res) {
  const rows = await service.listAll();
  return ApiResponse.ok(res, "Tax rates", rows);
}

export async function create(req, res) {
  const row = await service.create(req.body);
  return ApiResponse.created(res, "Tax rate created", row);
}

export async function update(req, res) {
  const row = await service.update(req.params.id, req.body);
  return ApiResponse.ok(res, "Tax rate updated", row);
}

export async function remove(req, res) {
  await service.remove(req.params.id);
  return ApiResponse.ok(res, "Tax rate removed");
}
