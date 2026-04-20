import ApiResponse from "../../common/utils/api-response.js";
import * as service from "./addresses.service.js";

export async function list(req, res) {
  const rows = await service.listMyAddresses(req.user.id);
  return ApiResponse.ok(res, "Addresses", rows);
}

export async function getOne(req, res) {
  const row = await service.getMyAddress(req.user.id, req.params.id);
  return ApiResponse.ok(res, "Address", row);
}

export async function create(req, res) {
  const row = await service.createAddress(req.user.id, req.body);
  return ApiResponse.created(res, "Address added", row);
}

export async function update(req, res) {
  const row = await service.updateAddress(req.user.id, req.params.id, req.body);
  return ApiResponse.ok(res, "Address updated", row);
}

export async function remove(req, res) {
  await service.deleteAddress(req.user.id, req.params.id);
  return ApiResponse.ok(res, "Address removed");
}

export async function setDefault(req, res) {
  const row = await service.setDefault(req.user.id, req.params.id);
  return ApiResponse.ok(res, "Default address set", row);
}
