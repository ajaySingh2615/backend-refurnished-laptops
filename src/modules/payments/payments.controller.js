import ApiResponse from "../../common/utils/api-response.js";
import * as service from "./payments.service.js";

export async function verify(req, res) {
  const data = await service.verifyAndFinalize({
    userId: req.user.id,
    orderId: req.body.orderId,
    razorpayOrderId: req.body.razorpayOrderId,
    razorpayPaymentId: req.body.razorpayPaymentId,
    razorpaySignature: req.body.razorpaySignature,
  });
  return ApiResponse.ok(res, "Payment verified", data);
}

export async function markFailed(req, res) {
  const data = await service.markFailed({
    userId: req.user.id,
    orderId: req.body.orderId,
    razorpayOrderId: req.body.razorpayOrderId,
    reason: req.body.reason,
  });
  return ApiResponse.ok(res, "Payment failure recorded", data);
}
