import { and, eq } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import { orders, payments } from "../../db/schema/index.js";
import ApiError from "../../common/utils/api-error.js";
import {
  createOrder as rzpCreateOrder,
  getPublicKeyId,
  isStubMode,
  verifySignature,
} from "../../common/config/razorpay.js";
import { commitStockForOrder } from "../orders/orders.service.js";
import { generateInvoiceForOrder } from "../invoices/invoices.service.js";

function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

/**
 * Called right after an order is placed. Creates (or stubs) a Razorpay order,
 * stores a pending `payments` row, and returns details the frontend needs to
 * launch the checkout widget.
 */
export async function createGatewayOrder(order) {
  const amountPaise = toPaise(order.grandTotal);

  const rzpOrder = await rzpCreateOrder({
    amount: amountPaise,
    currency: "INR",
    receipt: order.orderNumber,
    notes: { orderId: order.id, orderNumber: order.orderNumber },
  });

  const [pay] = await db
    .insert(payments)
    .values({
      orderId: order.id,
      method: "razorpay",
      gatewayOrderId: rzpOrder.id,
      status: "pending",
      amount: String(order.grandTotal),
    })
    .returning();

  return {
    keyId: getPublicKeyId(),
    orderId: rzpOrder.id,
    amount: amountPaise,
    currency: "INR",
    receipt: order.orderNumber,
    stubMode: isStubMode(),
    paymentId: pay.id,
  };
}

/**
 * Verify the signature returned by Razorpay, mark the payment as paid,
 * commit stock, auto-generate an invoice, and move the order to `confirmed`.
 */
export async function verifyAndFinalize({
  userId,
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);

  if (!order) throw ApiError.notFound("Order not found");

  if (["confirmed", "packed", "shipped", "delivered"].includes(order.status)) {
    // Already finalized — return current state idempotently.
    return { alreadyFinalized: true, order };
  }

  if (order.status === "cancelled" || order.status === "refunded") {
    throw ApiError.badRequest("Order is not payable anymore");
  }

  const ok = verifySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });
  if (!ok) {
    throw ApiError.badRequest("Invalid payment signature");
  }

  const [pay] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.orderId, orderId),
        eq(payments.gatewayOrderId, razorpayOrderId)
      )
    )
    .limit(1);

  if (!pay) throw ApiError.notFound("Payment record not found");
  if (pay.status === "paid") {
    return { alreadyFinalized: true, order };
  }

  const now = new Date();

  await db
    .update(payments)
    .set({
      gatewayPaymentId: razorpayPaymentId,
      status: "paid",
      paidAt: now,
    })
    .where(eq(payments.id, pay.id));

  await db
    .update(orders)
    .set({ status: "confirmed", updatedAt: now })
    .where(eq(orders.id, orderId));

  try {
    await commitStockForOrder(orderId, userId);
  } catch (err) {
    console.error("[payments] stock commit failed:", err);
  }

  let invoice = null;
  try {
    invoice = await generateInvoiceForOrder(orderId);
  } catch (err) {
    console.error("[payments] invoice generation failed:", err);
  }

  return { alreadyFinalized: false, orderId, invoice };
}

export async function markFailed({ userId, orderId, razorpayOrderId, reason }) {
  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);
  if (!order) throw ApiError.notFound("Order not found");

  await db
    .update(payments)
    .set({ status: "failed" })
    .where(
      and(
        eq(payments.orderId, orderId),
        eq(payments.gatewayOrderId, razorpayOrderId)
      )
    );
  return { ok: true, reason: reason || null };
}
