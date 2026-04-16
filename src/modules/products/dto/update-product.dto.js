import Joi from "joi";

export const updateProductSchema = Joi.object({
  categoryId: Joi.string().uuid().optional().messages({
    "string.guid": "categoryId must be a valid UUID",
  }),

  name: Joi.string().trim().max(255).optional(),

  slug: Joi.string().trim().max(280).optional(),

  description: Joi.string().trim().optional().allow(""),

  type: Joi.string().trim().valid("laptop", "accessory").optional().messages({
    "any.only": 'Type must be either "laptop" or "accessory"',
  }),

  brand: Joi.string().trim().max(100).optional().allow(""),

  hsnCode: Joi.string().trim().max(20).optional().allow(""),

  gstPercent: Joi.number().min(0).max(100).precision(2).optional(),

  isPublished: Joi.boolean().optional(),

  isFeatured: Joi.boolean().optional(),

  processor: Joi.string().trim().max(100).optional().allow("", null),
  ram: Joi.string().trim().max(50).optional().allow("", null),
  storage: Joi.string().trim().max(50).optional().allow("", null),
  display: Joi.string().trim().max(100).optional().allow("", null),
  gpu: Joi.string().trim().max(100).optional().allow("", null),
  os: Joi.string().trim().max(50).optional().allow("", null),
  conditionGrade: Joi.string().trim().max(20).optional().allow("", null),
  warrantyMonths: Joi.number().integer().min(0).optional().allow(null),
})
  .min(1)
  .messages({ "object.min": "At least one field is required to update" });
