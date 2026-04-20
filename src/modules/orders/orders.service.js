import { and, asc, desc, eq, ilike, or, sql, count } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import {
  orders,
  orderItems,
  productVariants,
  products,
  inventoryUnits,
  stockAdjustments,
  carts,
  cartItems,
  addresses,
  shippingMethods,
  users,
  invoices,
  payments,
  productImages,
} from "../../db/schema/index.js";
import ApiError from "../../common/utils/api-error.js";
import * as checkoutService from "../checkout/checkout.service.js";

// ── Order number ───────────────────────────────────────

function generateOrderNumber() {
  const now = new Date();
  const ymd =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ORD-${ymd}-${rand}`;
}

// ── Placement ──────────────────────────────────────────

/**
 * Creates an order in `placed` status using a checkout quote.
 * Stock is NOT decremented yet — that happens after payment success.
 * The user's cart is cleared once the order is persisted.
 */
export async function placeOrder(userId, payload) {
  const quote = await checkoutService.quote({
    userId,
    addressId: payload.addressId,
    shippingMethodId: payload.shippingMethodId,
  });

  const orderNumber = generateOrderNumber();

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      userId,
      addressId: payload.addressId,
      shippingMethodId: payload.shippingMethodId,
      status: "placed",
      subtotal: String(quote.subtotal),
      taxTotal: String(quote.taxTotal),
      shippingCost: String(quote.shippingCost),
      grandTotal: String(quote.grandTotal),
      notes: payload.notes || null,
    })
    .returning();

  const itemRows = quote.cart.items.map((i) => ({
    orderId: order.id,
    variantId: i.variantId,
    productName: i.productName,
    variantName: i.variantName,
    quantity: i.quantity,
    unitPrice: String(i.unitPrice),
    gstPercent: String(i.gstPercent),
    taxAmount: String(
      quote.items.find((q) => q.variantId === i.variantId)?.gstAmount || 0
    ),
    lineTotal: String(i.lineTotal),
  }));

  await db.insert(orderItems).values(itemRows);

  // Clear cart
  const [cart] = await db
    .select()
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);
  if (cart) {
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  }

  return { order, quote };
}

// ── Stock mutation ─────────────────────────────────────

/**
 * Decrement variant stock and consume inventory units.
 * Called by payments service on successful payment.
 */
export async function commitStockForOrder(orderId, actorId = null) {
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  for (const item of items) {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, item.variantId))
      .limit(1);

    if (!variant) continue;

    const qty = item.quantity;
    const nextStock = Math.max(0, variant.stock - qty);

    await db
      .update(productVariants)
      .set({ stock: nextStock, updatedAt: new Date() })
      .where(eq(productVariants.id, variant.id));

    // Consume oldest available units (if any are tracked for this variant)
    const availableUnits = await db
      .select({ id: inventoryUnits.id })
      .from(inventoryUnits)
      .where(
        and(
          eq(inventoryUnits.variantId, variant.id),
          eq(inventoryUnits.status, "available")
        )
      )
      .orderBy(asc(inventoryUnits.createdAt))
      .limit(qty);

    if (availableUnits.length > 0) {
      const now = new Date();
      for (const u of availableUnits) {
        await db
          .update(inventoryUnits)
          .set({ status: "sold", soldAt: now, updatedAt: now })
          .where(eq(inventoryUnits.id, u.id));
      }
    }

    await db.insert(stockAdjustments).values({
      variantId: variant.id,
      adjustedBy: actorId,
      quantityChange: -qty,
      stockAfter: nextStock,
      reason: "sale",
      notes: `Order ${orderId}`,
    });
  }
}

async function restoreStockForOrder(orderId, actorId = null) {
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  for (const item of items) {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, item.variantId))
      .limit(1);
    if (!variant) continue;

    const nextStock = variant.stock + item.quantity;
    await db
      .update(productVariants)
      .set({ stock: nextStock, updatedAt: new Date() })
      .where(eq(productVariants.id, variant.id));

    await db.insert(stockAdjustments).values({
      variantId: variant.id,
      adjustedBy: actorId,
      quantityChange: item.quantity,
      stockAfter: nextStock,
      reason: "return",
      notes: `Order ${orderId} cancelled`,
    });
  }
}

// ── Reads ──────────────────────────────────────────────

async function loadOrderDetail(orderId, { ownerUserId = null } = {}) {
  const [row] = await db
    .select({
      order: orders,
      address: addresses,
      shippingMethod: shippingMethods,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      },
    })
    .from(orders)
    .leftJoin(addresses, eq(orders.addressId, addresses.id))
    .leftJoin(shippingMethods, eq(orders.shippingMethodId, shippingMethods.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .where(
      ownerUserId
        ? and(eq(orders.id, orderId), eq(orders.userId, ownerUserId))
        : eq(orders.id, orderId)
    )
    .limit(1);

  if (!row) throw ApiError.notFound("Order not found");

  const items = await db
    .select({
      item: orderItems,
      product: {
        id: products.id,
        slug: products.slug,
      },
    })
    .from(orderItems)
    .leftJoin(productVariants, eq(orderItems.variantId, productVariants.id))
    .leftJoin(products, eq(productVariants.productId, products.id))
    .where(eq(orderItems.orderId, orderId));

  const productIds = items
    .map((r) => r.product?.id)
    .filter(Boolean);

  let imageByProduct = new Map();
  if (productIds.length) {
    const imgs = await db
      .select()
      .from(productImages)
      .where(sql`${productImages.productId} IN ${productIds}`)
      .orderBy(asc(productImages.sortOrder));
    for (const img of imgs) {
      if (!imageByProduct.has(img.productId)) {
        imageByProduct.set(img.productId, img);
      }
    }
  }

  const [invoice] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.orderId, orderId))
    .limit(1);

  const pays = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, orderId))
    .orderBy(desc(payments.createdAt));

  return {
    ...row.order,
    address: row.address,
    shippingMethod: row.shippingMethod,
    user: row.user,
    items: items.map((i) => ({
      ...i.item,
      productSlug: i.product?.slug || null,
      imageUrl: i.product?.id
        ? imageByProduct.get(i.product.id)?.url || null
        : null,
    })),
    invoice: invoice || null,
    payments: pays,
  };
}

export async function listMine(userId, query) {
  const { page = 1, limit = 20 } = query;

  const [{ total }] = await db
    .select({ total: count() })
    .from(orders)
    .where(eq(orders.userId, userId));

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.placedAt))
    .limit(limit)
    .offset((page - 1) * limit);

  return {
    items: rows,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getMine(userId, id) {
  return loadOrderDetail(id, { ownerUserId: userId });
}

// ── Admin reads ────────────────────────────────────────

export async function adminList(query) {
  const { page = 1, limit = 20, status, search, sort = "newest" } = query;

  const conditions = [];
  if (status) conditions.push(eq(orders.status, status));

  if (search) {
    const s = `%${search}%`;
    conditions.push(
      or(
        ilike(orders.orderNumber, s),
        ilike(users.name, s),
        ilike(users.email, s),
        ilike(users.phone, s)
      )
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const totalQuery = db
    .select({ total: count() })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id));
  if (whereClause) totalQuery.where(whereClause);
  const [{ total }] = await totalQuery;

  let orderBy;
  switch (sort) {
    case "oldest":
      orderBy = asc(orders.placedAt);
      break;
    case "amount_desc":
      orderBy = desc(orders.grandTotal);
      break;
    case "amount_asc":
      orderBy = asc(orders.grandTotal);
      break;
    default:
      orderBy = desc(orders.placedAt);
  }

  const baseQuery = db
    .select({
      order: orders,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
      },
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id));

  if (whereClause) baseQuery.where(whereClause);

  const rows = await baseQuery
    .orderBy(orderBy)
    .limit(limit)
    .offset((page - 1) * limit);

  const orderIds = rows.map((r) => r.order.id);
  let paidMap = new Map();
  if (orderIds.length) {
    const pays = await db
      .select({
        orderId: payments.orderId,
        status: payments.status,
        method: payments.method,
      })
      .from(payments)
      .where(sql`${payments.orderId} IN ${orderIds}`);
    for (const p of pays) {
      if (p.status === "paid") paidMap.set(p.orderId, p);
      else if (!paidMap.has(p.orderId)) paidMap.set(p.orderId, p);
    }
  }

  return {
    items: rows.map((r) => ({
      ...r.order,
      user: r.user,
      payment: paidMap.get(r.order.id) || null,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function adminGet(id) {
  return loadOrderDetail(id);
}

// ── Status transitions ─────────────────────────────────

const FORWARD_FLOW = {
  placed: ["confirmed", "cancelled"],
  confirmed: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
  refunded: [],
};

export async function updateStatus(id, newStatus) {
  const order = await adminGet(id);
  const allowed = FORWARD_FLOW[order.status] || [];
  if (!allowed.includes(newStatus)) {
    throw ApiError.badRequest(
      `Cannot transition from ${order.status} to ${newStatus}`
    );
  }

  await db
    .update(orders)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(orders.id, id));

  return adminGet(id);
}

export async function cancelOrder(id, actorId, { reason = "", asAdmin = false, asOwner = null } = {}) {
  const order = await loadOrderDetail(id, { ownerUserId: asOwner });

  if (!["placed", "confirmed", "packed"].includes(order.status)) {
    throw ApiError.badRequest(
      `Order cannot be cancelled in ${order.status} state`
    );
  }

  // Only admins can cancel after confirmed
  if (!asAdmin && order.status !== "placed") {
    throw ApiError.forbidden(
      "Confirmed orders can only be cancelled by support"
    );
  }

  const wasPaid = order.payments.some((p) => p.status === "paid");

  // If stock was committed (confirmed+), restore it
  if (["confirmed", "packed"].includes(order.status)) {
    await restoreStockForOrder(id, actorId);
  }

  await db
    .update(orders)
    .set({
      status: "cancelled",
      notes: reason
        ? `${order.notes || ""}\nCancelled: ${reason}`.trim()
        : order.notes,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, id));

  if (wasPaid) {
    // Mark the latest paid payment as refunded (book-keeping; actual refund is out of MVP scope)
    const paidPayment = order.payments.find((p) => p.status === "paid");
    if (paidPayment) {
      await db
        .update(payments)
        .set({ status: "refunded" })
        .where(eq(payments.id, paidPayment.id));
    }
    await db
      .update(orders)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(orders.id, id));
  }

  return adminGet(id);
}
