import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import {
  authenticate,
  requireAdmin,
} from "../auth/auth.middleware.js";
import { upsertShopSettingsSchema } from "./dto/upsert-shop-settings.dto.js";
import * as ctrl from "./shop-settings.controller.js";

const router = Router();

router.get(
  "/api/shop-settings",
  asyncHandler(ctrl.getSettings)
);

router.put(
  "/api/admin/shop-settings",
  asyncHandler(authenticate),
  asyncHandler(requireAdmin),
  validateDto(upsertShopSettingsSchema),
  asyncHandler(ctrl.upsertSettings)
);

export default router;
