import Joi from "joi";

export const sendOtpSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^\+[1-9]\d{6,14}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone must be in E.164 format (e.g. +919876543210)",
      "any.required": "Phone number is required",
    }),
});
