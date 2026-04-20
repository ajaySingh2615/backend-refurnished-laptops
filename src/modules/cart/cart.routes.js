import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import { authenticateAndCheckBan } from "../auth/auth.middleware.js";
import { addItemSchema, updateItemSchema } from "./dto/add-item.dto.js";
import * as ctrl from "./cart.controller.js";

const router = Router();
const auth = [asyncHandler(authenticateAndCheckBan)];

router.get("/api/cart", ...auth, asyncHandler(ctrl.getCart));
router.post(
  "/api/cart/items",
  ...auth,
  validateDto(addItemSchema),
  asyncHandler(ctrl.addItem)
);
router.patch(
  "/api/cart/items/:itemId",
  ...auth,
  validateDto(updateItemSchema),
  asyncHandler(ctrl.updateItem)
);
router.delete(
  "/api/cart/items/:itemId",
  ...auth,
  asyncHandler(ctrl.removeItem)
);
router.delete("/api/cart", ...auth, asyncHandler(ctrl.clearCart));

export default router;
