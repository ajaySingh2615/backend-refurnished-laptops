import { Router } from "express";
import Joi from "joi";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import { authenticateAndCheckBan } from "../auth/auth.middleware.js";
import { verifyPaymentSchema } from "./dto/verify-payment.dto.js";
import * as ctrl from "./payments.controller.js";

const router = Router();
const auth = [asyncHandler(authenticateAndCheckBan)];

router.post(
  "/api/payments/verify",
  ...auth,
  validateDto(verifyPaymentSchema),
  asyncHandler(ctrl.verify)
);

const failureSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  razorpayOrderId: Joi.string().required(),
  reason: Joi.string().trim().max(300).optional().allow(""),
});

router.post(
  "/api/payments/failed",
  ...auth,
  validateDto(failureSchema),
  asyncHandler(ctrl.markFailed)
);

export default router;
