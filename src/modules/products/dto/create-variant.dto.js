import Joi from "joi";

export const createVariantSchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    "string.empty": "Variant name is required",
    "any.required": "Variant name is required",
  }),
  sku: Joi.string().trim().max(50).required().messages({
    "string.empty": "SKU is required",
    "any.required": "SKU is required",
  }),
  price: Joi.number().positive().precision(2).required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be positive",
    "any.required": "Price is required",
  }),
  compareAtPrice: Joi.number().positive().precision(2).optional().allow(null),
  stock: Joi.number().integer().min(0).optional().default(0),
  lowStockThreshold: Joi.number().integer().min(0).optional().default(5),
  isActive: Joi.boolean().optional().default(true),
  sortOrder: Joi.number().integer().min(0).optional().default(0),
});
