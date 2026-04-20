import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import { authenticate, requireAdmin } from "../auth/auth.middleware.js";
import * as ctrl from "./admin.controller.js";

const router = Router();
const admin = [asyncHandler(authenticate), asyncHandler(requireAdmin)];

router.get("/api/admin/stats", ...admin, asyncHandler(ctrl.stats));
router.get("/api/admin/users", ...admin, asyncHandler(ctrl.listUsers));
router.post("/api/admin/users/:id/ban", ...admin, asyncHandler(ctrl.banUser));
router.post("/api/admin/users/:id/unban", ...admin, asyncHandler(ctrl.unbanUser));

export default router;
