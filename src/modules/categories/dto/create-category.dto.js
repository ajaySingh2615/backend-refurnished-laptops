import Joi from "joi";

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().max(100).required().messages({
    "string.empty": "Category name is required",
    "any.required": "Category name is required",
  }),

  slug: Joi.string().trim().max(120).optional().messages({
    "string.max": "Slug must be at most 120 characters",
  }),

  parentId: Joi.string().uuid().optional().allow(null).messages({
    "string.guid": "parentId must be a valid UUID",
  }),

  description: Joi.string().trim().optional().allow(""),

  imageUrl: Joi.string().trim().uri().optional().allow("").messages({
    "string.uri": "imageUrl must be a valid URL",
  }),

  sortOrder: Joi.number().integer().min(0).optional().default(0),

  isActive: Joi.boolean().optional().default(true),
});
