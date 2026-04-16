import Joi from "joi";

const variantSchema = Joi.object({
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

export const createProductSchema = Joi.object({
  categoryId: Joi.string().uuid().required().messages({
    "string.guid": "categoryId must be a valid UUID",
    "any.required": "categoryId is required",
  }),

  name: Joi.string().trim().max(255).required().messages({
    "string.empty": "Product name is required",
    "any.required": "Product name is required",
  }),

  slug: Joi.string().trim().max(280).optional(),

  description: Joi.string().trim().optional().allow(""),

  type: Joi.string().trim().valid("laptop", "accessory").required().messages({
    "any.only": 'Type must be either "laptop" or "accessory"',
    "any.required": "Product type is required",
  }),

  brand: Joi.string().trim().max(100).optional().allow(""),

  hsnCode: Joi.string().trim().max(20).optional().allow(""),

  gstPercent: Joi.number().min(0).max(100).precision(2).optional().default(18.0),

  isPublished: Joi.boolean().optional().default(false),

  isFeatured: Joi.boolean().optional().default(false),

  // Laptop-specific fields
  processor: Joi.string().trim().max(100).optional().allow("", null),
  ram: Joi.string().trim().max(50).optional().allow("", null),
  storage: Joi.string().trim().max(50).optional().allow("", null),
  display: Joi.string().trim().max(100).optional().allow("", null),
  gpu: Joi.string().trim().max(100).optional().allow("", null),
  os: Joi.string().trim().max(50).optional().allow("", null),
  conditionGrade: Joi.string().trim().max(20).optional().allow("", null),
  warrantyMonths: Joi.number().integer().min(0).optional().allow(null),

  variants: Joi.array().items(variantSchema).min(1).required().messages({
    "array.min": "At least one variant is required",
    "any.required": "Variants array is required",
  }),
});
