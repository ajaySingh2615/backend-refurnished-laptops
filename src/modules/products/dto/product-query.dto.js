import Joi from "joi";

export const productQuerySchema = Joi.object({
  category: Joi.string().trim().optional(),
  brand: Joi.string().trim().optional(),
  type: Joi.string().trim().valid("laptop", "accessory").optional(),
  processor: Joi.string().trim().optional(),
  ram: Joi.string().trim().optional(),
  os: Joi.string().trim().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  featured: Joi.boolean().optional(),
  search: Joi.string().trim().max(200).optional(),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  sort: Joi.string()
    .trim()
    .valid("price_asc", "price_desc", "newest", "name")
    .optional()
    .default("newest"),
});
