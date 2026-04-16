import Joi from "joi";

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const upsertShopSettingsSchema = Joi.object({
  shopName: Joi.string().trim().max(255).required().messages({
    "string.empty": "Shop name is required",
    "any.required": "Shop name is required",
  }),

  gstin: Joi.string().trim().uppercase().pattern(GSTIN_REGEX).required().messages({
    "string.empty": "GSTIN is required",
    "any.required": "GSTIN is required",
    "string.pattern.base": "GSTIN must be a valid 15-character GST number",
  }),

  pan: Joi.string().trim().uppercase().pattern(PAN_REGEX).optional().allow("").messages({
    "string.pattern.base": "PAN must be a valid 10-character PAN number",
  }),

  address: Joi.string().trim().required().messages({
    "string.empty": "Address is required",
    "any.required": "Address is required",
  }),

  state: Joi.string().trim().max(100).required().messages({
    "string.empty": "State is required",
    "any.required": "State is required",
  }),

  phone: Joi.string().trim().max(20).required().messages({
    "string.empty": "Phone is required",
    "any.required": "Phone is required",
  }),

  email: Joi.string().trim().email().max(255).required().messages({
    "string.empty": "Email is required",
    "any.required": "Email is required",
    "string.email": "Must be a valid email address",
  }),

  invoicePrefix: Joi.string().trim().uppercase().max(10).optional().default("INV"),
});
