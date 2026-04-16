import Joi from "joi";

export const updateProductImageSchema = Joi.object({
  altText: Joi.string().trim().max(255).optional().allow(""),
  sortOrder: Joi.number().integer().min(0).optional(),
})
  .min(1)
  .messages({ "object.min": "At least one field (altText or sortOrder) is required" });
