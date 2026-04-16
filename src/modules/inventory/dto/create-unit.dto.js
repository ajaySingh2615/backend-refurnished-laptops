import Joi from "joi";

export const createUnitSchema = Joi.object({
  serialNumber: Joi.string().trim().max(100).required().messages({
    "string.empty": "Serial number is required",
    "any.required": "Serial number is required",
  }),

  conditionGrade: Joi.string()
    .trim()
    .valid("A+", "A", "B+", "B", "C")
    .required()
    .messages({
      "any.only": "Condition grade must be one of: A+, A, B+, B, C",
      "any.required": "Condition grade is required",
    }),

  conditionNotes: Joi.string().trim().optional().allow(""),

  status: Joi.string()
    .trim()
    .valid("available", "sold", "reserved", "returned", "defective")
    .optional()
    .default("available"),
});
