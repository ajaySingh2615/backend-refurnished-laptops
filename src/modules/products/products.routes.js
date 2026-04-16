import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import { authenticate, requireAdmin } from "../auth/auth.middleware.js";
import { createProductSchema } from "./dto/create-product.dto.js";
import { updateProductSchema } from "./dto/update-product.dto.js";
import { createVariantSchema } from "./dto/create-variant.dto.js";
import { updateVariantSchema } from "./dto/update-variant.dto.js";
import { productQuerySchema } from "./dto/product-query.dto.js";
import * as ctrl from "./products.controller.js";

const router = Router();

// ── Public ──────────────────────────────────────────────

router.get(
  "/api/products",
  validateDto(productQuerySchema, "query"),
  asyncHandler(ctrl.listProducts)
);

router.get(
  "/api/products/:slug",
  asyncHandler(ctrl.getProductBySlug)
);

// ── Admin — Products ────────────────────────────────────

router.get(
  "/api/admin/products",
  asyncHandler(authenticate),
  asyncHandler(requireAdmin),
  asyncHandler(ctrl.adminListProducts)
);

router.post(
  "/api/admin/products",
  asyncHandler(authenticate),
  asyncHandler(requireAdmin),
  validateDto(createProductSchema),
  asyncHandler(ctrl.createProduct)
);

router.put(
  "/api/admin/products/:id",
  asyncHandler(authenticate),
  asyncHandler(requireAdmin),
  validateDto(updateProductSchema),
  asyncHandler(ctrl.updateProduct)
);

router.delete(
  "/api/admin/products/:id",
  asyncHandler(authenticate),
  asyncHandler(requireAdmin),
  asyncHandler(ctrl.deleteProduct)
);

// ── Admin — Variants ────────────────────────────────────

router.post(
  "/api/admin/products/:id/variants",
  asyncHandler(authenticate),
  asyncHandler(requireAdmin),
  validateDto(createVariantSchema),
  asyncHandler(ctrl.addVariant)
);

router.put(
  "/api/admin/products/:id/variants/:variantId",
  asyncHandler(authenticate),
  asyncHandler(requireAdmin),
  validateDto(updateVariantSchema),
  asyncHandler(ctrl.updateVariant)
);

router.delete(
  "/api/admin/products/:id/variants/:variantId",
  asyncHandler(authenticate),
  asyncHandler(requireAdmin),
  asyncHandler(ctrl.deleteVariant)
);

export default router;
