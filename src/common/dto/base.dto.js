import ApiError from "../utils/api-error.js";

export function validateDto(schema, source = "body") {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join("; ");
      throw ApiError.badRequest(messages);
    }

    req[source] = value;
    next();
  };
}
