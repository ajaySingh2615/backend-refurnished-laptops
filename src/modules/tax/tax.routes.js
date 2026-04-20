import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import { authenticate, requireAdmin } from "../auth/auth.middleware.js";
import { upsertTaxRateSchema } from "./dto/upsert-tax-rate.dto.js";
import * as ctrl from "./tax.controller.js";

const router = Router();
const admin = [asyncHandler(authenticate), asyncHandler(requireAdmin)];

router.get("/api/tax-rates", asyncHandler(ctrl.listPublic));

router.get("/api/admin/tax-rates", ...admin, asyncHandler(ctrl.adminList));
router.post(
  "/api/admin/tax-rates",
  ...admin,
  validateDto(upsertTaxRateSchema),
  asyncHandler(ctrl.create)
);
router.put(
  "/api/admin/tax-rates/:id",
  ...admin,
  validateDto(upsertTaxRateSchema),
  asyncHandler(ctrl.update)
);
router.delete("/api/admin/tax-rates/:id", ...admin, asyncHandler(ctrl.remove));

export default router;
