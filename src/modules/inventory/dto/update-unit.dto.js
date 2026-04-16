import Joi from "joi";

export const updateUnitSchema = Joi.object({
  status: Joi.string()
    .trim()
    .valid("available", "sold", "reserved", "returned", "defective")
    .optional(),

  conditionGrade: Joi.string()
    .trim()
    .valid("A+", "A", "B+", "B", "C")
    .optional(),

  conditionNotes: Joi.string().trim().optional().allow(""),
})
  .min(1)
  .messages({ "object.min": "At least one field is required to update" });
