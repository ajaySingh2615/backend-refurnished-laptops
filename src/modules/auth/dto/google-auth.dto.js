import Joi from "joi";

export const googleAuthSchema = Joi.object({
  idToken: Joi.string().required().messages({
    "string.empty": "Google ID token is required",
    "any.required": "Google ID token is required",
  }),
});
