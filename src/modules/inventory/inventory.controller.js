import ApiResponse from "../../common/utils/api-response.js";
import * as inventoryService from "./inventory.service.js";

export async function getLowStock(req, res) {
  const items = await inventoryService.getLowStockVariants();
  return ApiResponse.ok(res, "Low stock variants", items);
}

export async function adjustStock(req, res) {
  const result = await inventoryService.adjustStock(
    req.params.variantId,
    req.user.id,
    req.body
  );
  return ApiResponse.ok(res, "Stock adjusted", result);
}

export async function getHistory(req, res) {
  const history = await inventoryService.getAdjustmentHistory(req.params.variantId);
  return ApiResponse.ok(res, "Adjustment history", history);
}

export async function listUnits(req, res) {
  const units = await inventoryService.listUnits(req.params.variantId);
  return ApiResponse.ok(res, "Inventory units", units);
}

export async function createUnit(req, res) {
  const unit = await inventoryService.createUnit(
    req.params.variantId,
    req.user.id,
    req.body
  );
  return ApiResponse.created(res, "Unit added", unit);
}

export async function updateUnit(req, res) {
  const unit = await inventoryService.updateUnit(
    req.params.unitId,
    req.user.id,
    req.body
  );
  return ApiResponse.ok(res, "Unit updated", unit);
}

export async function deleteUnit(req, res) {
  await inventoryService.deleteUnit(req.params.unitId, req.user.id);
  return ApiResponse.ok(res, "Unit removed");
}
