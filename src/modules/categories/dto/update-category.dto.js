import Joi from "joi";

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().max(100).optional().messages({
    "string.max": "Name must be at most 100 characters",
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

  sortOrder: Joi.number().integer().min(0).optional(),

  isActive: Joi.boolean().optional(),
})
  .min(1)
  .messages({ "object.min": "At least one field is required to update" });
