import Joi from "joi";

const PINCODE_REGEX = /^[0-9]{6}$/;
const PHONE_REGEX = /^[+0-9 \-()]{7,20}$/;

export const upsertAddressSchema = Joi.object({
  label: Joi.string().trim().max(50).optional().allow(""),
  fullName: Joi.string().trim().max(100).required().messages({
    "string.empty": "Full name is required",
    "any.required": "Full name is required",
  }),
  phone: Joi.string().trim().pattern(PHONE_REGEX).required().messages({
    "string.pattern.base": "Enter a valid phone number",
    "any.required": "Phone is required",
  }),
  addressLine1: Joi.string().trim().required().messages({
    "any.required": "Address line 1 is required",
  }),
  addressLine2: Joi.string().trim().optional().allow(""),
  city: Joi.string().trim().max(100).required(),
  state: Joi.string().trim().max(100).required(),
  pincode: Joi.string().trim().pattern(PINCODE_REGEX).required().messages({
    "string.pattern.base": "Pincode must be a 6-digit number",
    "any.required": "Pincode is required",
  }),
  isDefault: Joi.boolean().optional().default(false),
});
