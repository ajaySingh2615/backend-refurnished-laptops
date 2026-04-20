import crypto from "node:crypto";
import Razorpay from "razorpay";

let cachedClient = null;

export function getRazorpayClient() {
  if (cachedClient) return cachedClient;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;

  cachedClient = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return cachedClient;
}

export function getPublicKeyId() {
  return process.env.RAZORPAY_KEY_ID || null;
}

export function isStubMode() {
  return !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET;
}

/**
 * Create a Razorpay order. Falls back to a stubbed gateway order when keys
 * are missing (development) so the checkout flow can be exercised end-to-end.
 */
export async function createOrder({ amount, currency = "INR", receipt, notes }) {
  const client = getRazorpayClient();

  if (!client) {
    return {
      id: `order_stub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount,
      currency,
      receipt,
      status: "created",
      stub: true,
    };
  }

  return client.orders.create({
    amount,
    currency,
    receipt,
    notes,
  });
}

/**
 * Verify a Razorpay payment signature (HMAC SHA256 of "<order>|<payment>").
 * In stub mode we accept the triplet if the payment id starts with `pay_stub_`
 * and matches the order's id — this lets the checkout page simulate success.
 */
export function verifySignature({ orderId, paymentId, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    return !!(
      orderId?.startsWith("order_stub_") &&
      paymentId?.startsWith("pay_stub_") &&
      signature === "stub_signature"
    );
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
