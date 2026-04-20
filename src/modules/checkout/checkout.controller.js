import ApiResponse from "../../common/utils/api-response.js";
import * as service from "./checkout.service.js";
import * as ordersService from "../orders/orders.service.js";
import * as paymentsService from "../payments/payments.service.js";

export async function quote(req, res) {
  const data = await service.quote({
    userId: req.user.id,
    addressId: req.body.addressId,
    shippingMethodId: req.body.shippingMethodId,
  });
  return ApiResponse.ok(res, "Checkout quote", data);
}

export async function placeOrder(req, res) {
  const { order, quote } = await ordersService.placeOrder(req.user.id, req.body);
  const razorpay = await paymentsService.createGatewayOrder(order);

  return ApiResponse.created(res, "Order placed", {
    order,
    quote,
    razorpay,
  });
}
