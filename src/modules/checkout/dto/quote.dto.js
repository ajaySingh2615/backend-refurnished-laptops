import Joi from "joi";

export const quoteSchema = Joi.object({
  addressId: Joi.string().uuid().required(),
  shippingMethodId: Joi.string().uuid().required(),
});

export const placeOrderSchema = Joi.object({
  addressId: Joi.string().uuid().required(),
  shippingMethodId: Joi.string().uuid().required(),
  notes: Joi.string().trim().max(500).optional().allow(""),
});
