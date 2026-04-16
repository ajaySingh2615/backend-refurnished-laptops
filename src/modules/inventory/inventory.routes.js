import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import { authenticate, requireAdmin } from "../auth/auth.middleware.js";
import { adjustStockSchema } from "./dto/adjust-stock.dto.js";
import { createUnitSchema } from "./dto/create-unit.dto.js";
import { updateUnitSchema } from "./dto/update-unit.dto.js";
import * as ctrl from "./inventory.controller.js";

const router = Router();

const admin = [asyncHandler(authenticate), asyncHandler(requireAdmin)];

// ── Stock ───────────────────────────────────────────────

router.get(
  "/api/admin/inventory/low-stock",
  ...admin,
  asyncHandler(ctrl.getLowStock)
);

router.post(
  "/api/admin/inventory/:variantId/adjust",
  ...admin,
  validateDto(adjustStockSchema),
  asyncHandler(ctrl.adjustStock)
);

router.get(
  "/api/admin/inventory/:variantId/history",
  ...admin,
  asyncHandler(ctrl.getHistory)
);

// ── Serial units ────────────────────────────────────────

router.get(
  "/api/admin/inventory/:variantId/units",
  ...admin,
  asyncHandler(ctrl.listUnits)
);

router.post(
  "/api/admin/inventory/:variantId/units",
  ...admin,
  validateDto(createUnitSchema),
  asyncHandler(ctrl.createUnit)
);

router.put(
  "/api/admin/inventory/units/:unitId",
  ...admin,
  validateDto(updateUnitSchema),
  asyncHandler(ctrl.updateUnit)
);

router.delete(
  "/api/admin/inventory/units/:unitId",
  ...admin,
  asyncHandler(ctrl.deleteUnit)
);

export default router;
