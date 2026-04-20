import Joi from "joi";

export const verifyPaymentSchema = Joi.object({
  orderId: Joi.string().uuid().required(),
  razorpayOrderId: Joi.string().required(),
  razorpayPaymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required(),
});
