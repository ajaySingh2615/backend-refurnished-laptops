import ApiError from "../utils/api-error.js";

function isApiError(err) {
  return err instanceof ApiError || err?.name === "ApiError";
}

/**
 * Global error handler — must be last middleware.
 */
export default function errorHandler(err, req, res, _next) {
  const statusCode = isApiError(err) ? err.statusCode : 500;
  const message =
    statusCode === 500 && process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Internal Server Error";

  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && statusCode === 500
      ? { stack: err.stack }
      : {}),
  });
}
