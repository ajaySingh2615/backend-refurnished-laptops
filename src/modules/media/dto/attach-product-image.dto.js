import Joi from "joi";

export const attachProductImageSchema = Joi.object({
  altText: Joi.string().trim().max(255).optional().allow(""),
  sortOrder: Joi.number().integer().min(0).optional().default(0),
});
