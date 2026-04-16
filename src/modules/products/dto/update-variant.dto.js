import Joi from "joi";

export const updateVariantSchema = Joi.object({
  name: Joi.string().trim().max(100).optional(),
  sku: Joi.string().trim().max(50).optional(),
  price: Joi.number().positive().precision(2).optional(),
  compareAtPrice: Joi.number().positive().precision(2).optional().allow(null),
  stock: Joi.number().integer().min(0).optional(),
  lowStockThreshold: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
})
  .min(1)
  .messages({ "object.min": "At least one field is required to update" });
