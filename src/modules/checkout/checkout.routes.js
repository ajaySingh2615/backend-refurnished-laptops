import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import { authenticateAndCheckBan } from "../auth/auth.middleware.js";
import { quoteSchema, placeOrderSchema } from "./dto/quote.dto.js";
import * as ctrl from "./checkout.controller.js";

const router = Router();
const auth = [asyncHandler(authenticateAndCheckBan)];

router.post(
  "/api/checkout/quote",
  ...auth,
  validateDto(quoteSchema),
  asyncHandler(ctrl.quote)
);

router.post(
  "/api/checkout/place-order",
  ...auth,
  validateDto(placeOrderSchema),
  asyncHandler(ctrl.placeOrder)
);

export default router;
