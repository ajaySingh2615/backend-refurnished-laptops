import ApiResponse from "../../common/utils/api-response.js";
import * as service from "./cart.service.js";

export async function getCart(req, res) {
  const data = await service.getCart(req.user.id);
  return ApiResponse.ok(res, "Cart", data);
}

export async function addItem(req, res) {
  const data = await service.addItem(req.user.id, req.body);
  return ApiResponse.ok(res, "Item added", data);
}

export async function updateItem(req, res) {
  const data = await service.updateItem(
    req.user.id,
    req.params.itemId,
    req.body.quantity
  );
  return ApiResponse.ok(res, "Item updated", data);
}

export async function removeItem(req, res) {
  const data = await service.removeItem(req.user.id, req.params.itemId);
  return ApiResponse.ok(res, "Item removed", data);
}

export async function clearCart(req, res) {
  const data = await service.clearCart(req.user.id);
  return ApiResponse.ok(res, "Cart cleared", data);
}
