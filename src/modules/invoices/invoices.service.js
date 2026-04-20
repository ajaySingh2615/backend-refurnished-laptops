import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import {
  addresses,
  invoices,
  orderItems,
  orders,
  shopSettings,
  users,
} from "../../db/schema/index.js";
import ApiError from "../../common/utils/api-error.js";
import { computeTax } from "../tax/tax.service.js";

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Atomically bumps `shop_settings.next_invoice_number` and returns the number
 * that was just consumed.
 */
async function consumeInvoiceCounter() {
  const [row] = await db.execute(sql`
    UPDATE shop_settings
    SET next_invoice_number = next_invoice_number + 1,
        updated_at = NOW()
    WHERE id = 1
    RETURNING invoice_prefix, next_invoice_number - 1 AS number
  `);

  if (!row) {
    throw ApiError.badRequest("Shop settings are not configured");
  }

  const prefix = row.invoice_prefix || "INV";
  const num = row.number;
  return `${prefix}-${String(num).padStart(5, "0")}`;
}

/**
 * Generate an invoice for a paid order. Idempotent — returns the existing
 * invoice if one is already present for the order.
 */
export async function generateInvoiceForOrder(orderId) {
  const [existing] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.orderId, orderId))
    .limit(1);
  if (existing) return existing;

  const [orderRow] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!orderRow) throw ApiError.notFound("Order not found");

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const [addr] = await db
    .select()
    .from(addresses)
    .where(eq(addresses.id, orderRow.addressId))
    .limit(1);

  const [shop] = await db.select().from(shopSettings).limit(1);
  if (!shop) throw ApiError.badRequest("Shop settings are not configured");

  const tax = computeTax({
    items: items.map((i) => ({
      lineTotal: Number(i.lineTotal),
      gstPercent: Number(i.gstPercent),
    })),
    shopState: shop.state,
    buyerState: addr?.state || "",
  });

  const invoiceNumber = await consumeInvoiceCounter();

  const [invoice] = await db
    .insert(invoices)
    .values({
      orderId: orderId,
      invoiceNumber,
      subtotal: String(round2(tax.taxableValue)),
      cgst: String(round2(tax.cgst)),
      sgst: String(round2(tax.sgst)),
      igst: String(round2(tax.igst)),
      total: String(round2(tax.subtotal)),
      buyerName: addr?.fullName || "Guest",
      buyerAddress: [
        addr?.addressLine1,
        addr?.addressLine2,
        addr?.city,
        addr?.state,
        addr?.pincode,
      ]
        .filter(Boolean)
        .join(", "),
      buyerState: addr?.state || "",
    })
    .returning();

  return invoice;
}

// ── Queries ────────────────────────────────────────────

export async function getInvoiceForOrder(orderId, { ownerUserId = null } = {}) {
  const [inv] = await db
    .select({
      invoice: invoices,
      order: orders,
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .where(
      ownerUserId
        ? and(eq(invoices.orderId, orderId), eq(orders.userId, ownerUserId))
        : eq(invoices.orderId, orderId)
    )
    .limit(1);

  if (!inv) throw ApiError.notFound("Invoice not found");

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  const [addr] = inv.order.addressId
    ? await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, inv.order.addressId))
        .limit(1)
    : [null];

  const [buyer] = await db
    .select({
      name: users.name,
      email: users.email,
      phone: users.phone,
    })
    .from(users)
    .where(eq(users.id, inv.order.userId))
    .limit(1);

  const [shop] = await db.select().from(shopSettings).limit(1);

  return {
    invoice: inv.invoice,
    order: inv.order,
    items,
    address: addr || null,
    buyer,
    shop,
  };
}

export async function adminList({ page = 1, limit = 20 } = {}) {
  const rows = await db
    .select({
      invoice: invoices,
      order: orders,
    })
    .from(invoices)
    .innerJoin(orders, eq(invoices.orderId, orders.id))
    .orderBy(desc(invoices.issuedAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return rows.map((r) => ({
    ...r.invoice,
    orderNumber: r.order.orderNumber,
    orderStatus: r.order.status,
  }));
}
