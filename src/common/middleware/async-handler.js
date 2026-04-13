/**
 * Wraps async route handlers so rejections call next(err).
 */
export default function asyncHandler(fn) {
  return function asyncRoute(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
