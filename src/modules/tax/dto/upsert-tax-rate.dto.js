import Joi from "joi";

export const upsertTaxRateSchema = Joi.object({
  name: Joi.string().trim().max(50).required(),
  rate: Joi.number().precision(2).min(0).max(100).required(),
  isActive: Joi.boolean().optional().default(true),
});
