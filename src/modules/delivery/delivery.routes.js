import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import { authenticate, requireAdmin } from "../auth/auth.middleware.js";
import { upsertShippingMethodSchema } from "./dto/upsert-shipping-method.dto.js";
import * as ctrl from "./delivery.controller.js";

const router = Router();
const admin = [asyncHandler(authenticate), asyncHandler(requireAdmin)];

router.get("/api/shipping-methods", asyncHandler(ctrl.listPublic));

router.get(
  "/api/admin/shipping-methods",
  ...admin,
  asyncHandler(ctrl.adminList)
);
router.post(
  "/api/admin/shipping-methods",
  ...admin,
  validateDto(upsertShippingMethodSchema),
  asyncHandler(ctrl.create)
);
router.put(
  "/api/admin/shipping-methods/:id",
  ...admin,
  validateDto(upsertShippingMethodSchema),
  asyncHandler(ctrl.update)
);
router.delete(
  "/api/admin/shipping-methods/:id",
  ...admin,
  asyncHandler(ctrl.remove)
);

export default router;
