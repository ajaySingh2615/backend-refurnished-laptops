import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import {
  authenticate,
  authenticateAndCheckBan,
  requireAdmin,
} from "../auth/auth.middleware.js";
import {
  orderQuerySchema,
  updateStatusSchema,
  cancelOrderSchema,
} from "./dto/order-query.dto.js";
import * as ctrl from "./orders.controller.js";

const router = Router();
const auth = [asyncHandler(authenticateAndCheckBan)];
const admin = [asyncHandler(authenticate), asyncHandler(requireAdmin)];

// ── Customer ───────────────────────────────────────────
router.get(
  "/api/orders",
  ...auth,
  validateDto(orderQuerySchema, "query"),
  asyncHandler(ctrl.listMine)
);
router.get("/api/orders/:id", ...auth, asyncHandler(ctrl.getMine));
router.post(
  "/api/orders/:id/cancel",
  ...auth,
  validateDto(cancelOrderSchema),
  asyncHandler(ctrl.cancelMine)
);

// ── Admin ──────────────────────────────────────────────
router.get(
  "/api/admin/orders",
  ...admin,
  validateDto(orderQuerySchema, "query"),
  asyncHandler(ctrl.adminList)
);
router.get("/api/admin/orders/:id", ...admin, asyncHandler(ctrl.adminGet));
router.patch(
  "/api/admin/orders/:id/status",
  ...admin,
  validateDto(updateStatusSchema),
  asyncHandler(ctrl.adminUpdateStatus)
);
router.post(
  "/api/admin/orders/:id/cancel",
  ...admin,
  validateDto(cancelOrderSchema),
  asyncHandler(ctrl.adminCancel)
);

export default router;
