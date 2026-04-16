import Joi from "joi";

export const adjustStockSchema = Joi.object({
  quantity: Joi.number().integer().not(0).required().messages({
    "number.base": "Quantity must be a number",
    "any.invalid": "Quantity cannot be zero",
    "any.required": "Quantity is required",
  }),

  reason: Joi.string()
    .trim()
    .valid("restock", "sale", "return", "correction", "reserved")
    .required()
    .messages({
      "any.only": "Reason must be one of: restock, sale, return, correction, reserved",
      "any.required": "Reason is required",
    }),

  notes: Joi.string().trim().optional().allow(""),
});
