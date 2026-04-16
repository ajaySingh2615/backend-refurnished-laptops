import { Router } from "express";
import multer from "multer";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import { authenticate, requireAdmin } from "../auth/auth.middleware.js";
import { attachProductImageSchema } from "./dto/attach-product-image.dto.js";
import { updateProductImageSchema } from "./dto/update-product-image.dto.js";
import * as ctrl from "./media.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const admin = [asyncHandler(authenticate), asyncHandler(requireAdmin)];

router.post(
  "/api/admin/products/:productId/images",
  ...admin,
  upload.single("image"),
  validateDto(attachProductImageSchema),
  asyncHandler(ctrl.uploadImage)
);

router.put(
  "/api/admin/products/:productId/images/:imageId",
  ...admin,
  validateDto(updateProductImageSchema),
  asyncHandler(ctrl.updateImage)
);

router.delete(
  "/api/admin/products/:productId/images/:imageId",
  ...admin,
  asyncHandler(ctrl.deleteImage)
);

export default router;
