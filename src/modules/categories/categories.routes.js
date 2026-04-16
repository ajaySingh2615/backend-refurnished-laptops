import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import { authenticate, requireAdmin } from "../auth/auth.middleware.js";
import { createCategorySchema } from "./dto/create-category.dto.js";
import { updateCategorySchema } from "./dto/update-category.dto.js";
import * as ctrl from "./categories.controller.js";

const router = Router();

// ── Public ──────────────────────────────────────────────

router.get("/api/categories", asyncHandler(ctrl.getCategoryTree));

router.get("/api/categories/:slug", asyncHandler(ctrl.getCategoryBySlug));

// ── Admin ───────────────────────────────────────────────

router.get(
  "/api/admin/categories",
  asyncHandler(authenticate),
  asyncHandler(requireAdmin),
  asyncHandler(ctrl.listAllCategories)
);

router.post(
  "/api/admin/categories",
  asyncHandler(authenticate),
  asyncHandler(requireAdmin),
  validateDto(createCategorySchema),
  asyncHandler(ctrl.createCategory)
);

router.put(
  "/api/admin/categories/:id",
  asyncHandler(authenticate),
  asyncHandler(requireAdmin),
  validateDto(updateCategorySchema),
  asyncHandler(ctrl.updateCategory)
);

router.delete(
  "/api/admin/categories/:id",
  asyncHandler(authenticate),
  asyncHandler(requireAdmin),
  asyncHandler(ctrl.deleteCategory)
);

export default router;
