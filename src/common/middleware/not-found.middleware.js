import ApiError from "../utils/api-error.js";

/**
 * 404 for unknown routes (mount after all real routes).
 */
export default function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
}
