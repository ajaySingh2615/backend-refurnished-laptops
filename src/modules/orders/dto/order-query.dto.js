import Joi from "joi";

export const orderQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid("placed", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded")
    .optional(),
  search: Joi.string().trim().max(100).optional().allow(""),
  sort: Joi.string()
    .valid("newest", "oldest", "amount_desc", "amount_asc")
    .default("newest"),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid("confirmed", "packed", "shipped", "delivered")
    .required(),
});

export const cancelOrderSchema = Joi.object({
  reason: Joi.string().trim().max(200).optional().allow(""),
});
