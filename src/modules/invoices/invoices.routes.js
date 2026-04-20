import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import {
  authenticate,
  authenticateAndCheckBan,
  requireAdmin,
} from "../auth/auth.middleware.js";
import * as ctrl from "./invoices.controller.js";

const router = Router();
const auth = [asyncHandler(authenticateAndCheckBan)];
const admin = [asyncHandler(authenticate), asyncHandler(requireAdmin)];

router.get("/api/orders/:orderId/invoice", ...auth, asyncHandler(ctrl.getMyInvoice));
router.get(
  "/api/orders/:orderId/invoice/print",
  ...auth,
  asyncHandler(ctrl.getMyInvoiceHtml)
);

router.get(
  "/api/admin/invoices",
  ...admin,
  asyncHandler(ctrl.adminList)
);
router.get(
  "/api/admin/orders/:orderId/invoice",
  ...admin,
  asyncHandler(ctrl.adminGetInvoice)
);
router.get(
  "/api/admin/orders/:orderId/invoice/print",
  ...admin,
  asyncHandler(ctrl.adminGetInvoiceHtml)
);

export default router;
