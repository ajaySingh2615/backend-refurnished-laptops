import Joi from "joi";

export const addItemSchema = Joi.object({
  variantId: Joi.string().uuid().required().messages({
    "any.required": "variantId is required",
    "string.guid": "variantId must be a UUID",
  }),
  quantity: Joi.number().integer().min(1).max(20).default(1),
});

export const updateItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(20).required().messages({
    "any.required": "quantity is required",
  }),
});
