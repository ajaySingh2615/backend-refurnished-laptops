import Joi from "joi";

export const upsertShippingMethodSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),
  description: Joi.string().trim().max(500).optional().allow(""),
  baseCost: Joi.number().precision(2).min(0).required(),
  freeAbove: Joi.number().precision(2).min(0).optional().allow(null),
  estimatedDays: Joi.string().trim().max(30).optional().allow(""),
  isPickup: Joi.boolean().optional().default(false),
  isActive: Joi.boolean().optional().default(true),
});
