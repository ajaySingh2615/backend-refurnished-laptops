import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import {
  carts,
  cartItems,
  productVariants,
  products,
  productImages,
} from "../../db/schema/index.js";
import ApiError from "../../common/utils/api-error.js";

async function getOrCreateCart(userId) {
  const [existing] = await db
    .select()
    .from(carts)
    .where(eq(carts.userId, userId))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(carts)
    .values({ userId })
    .returning();

  return created;
}

async function loadCartItems(cartId) {
  const rows = await db
    .select({
      item: cartItems,
      variant: productVariants,
      product: products,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt));

  if (rows.length === 0) return [];

  const productIds = [...new Set(rows.map((r) => r.product.id))];
  const imgRows = await db
    .select()
    .from(productImages)
    .where(sql`${productImages.productId} IN ${productIds}`)
    .orderBy(asc(productImages.sortOrder));

  const imageByProduct = new Map();
  for (const img of imgRows) {
    if (!imageByProduct.has(img.productId)) {
      imageByProduct.set(img.productId, img);
    }
  }

  return rows.map(({ item, variant, product }) => {
    const primaryImage =
      imgRows.find(
        (i) => i.productId === product.id && i.variantId === variant.id
      ) || imageByProduct.get(product.id) || null;

    const unitPrice = Number(item.unitPrice);
    const currentPrice = Number(variant.price);

    return {
      id: item.id,
      variantId: variant.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      variantName: variant.name,
      sku: variant.sku,
      unitPrice,
      currentPrice,
      priceChanged: currentPrice !== unitPrice,
      quantity: item.quantity,
      lineTotal: Number((unitPrice * item.quantity).toFixed(2)),
      stock: variant.stock,
      gstPercent: Number(product.gstPercent),
      imageUrl: primaryImage?.url || null,
      isActive: variant.isActive,
    };
  });
}

function summarize(items) {
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return {
    subtotal: Number(subtotal.toFixed(2)),
    itemCount,
  };
}

export async function getCart(userId) {
  const cart = await getOrCreateCart(userId);
  const items = await loadCartItems(cart.id);
  return { id: cart.id, items, ...summarize(items) };
}

export async function addItem(userId, { variantId, quantity }) {
  const [variant] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);

  if (!variant || !variant.isActive) {
    throw ApiError.notFound("Variant not available");
  }

  if (variant.stock < quantity) {
    throw ApiError.badRequest(
      variant.stock === 0
        ? "This item is out of stock"
        : `Only ${variant.stock} left in stock`
    );
  }

  const cart = await getOrCreateCart(userId);

  const [existing] = await db
    .select()
    .from(cartItems)
    .where(
      and(eq(cartItems.cartId, cart.id), eq(cartItems.variantId, variantId))
    )
    .limit(1);

  if (existing) {
    const nextQty = Math.min(existing.quantity + quantity, 20);
    if (variant.stock < nextQty) {
      throw ApiError.badRequest(`Only ${variant.stock} available in total`);
    }
    await db
      .update(cartItems)
      .set({ quantity: nextQty, unitPrice: variant.price })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db.insert(cartItems).values({
      cartId: cart.id,
      variantId,
      quantity,
      unitPrice: variant.price,
    });
  }

  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cart.id));

  return getCart(userId);
}

export async function updateItem(userId, itemId, quantity) {
  const cart = await getOrCreateCart(userId);

  const [row] = await db
    .select({
      item: cartItems,
      variant: productVariants,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)))
    .limit(1);

  if (!row) throw ApiError.notFound("Cart item not found");

  if (row.variant.stock < quantity) {
    throw ApiError.badRequest(`Only ${row.variant.stock} available`);
  }

  await db
    .update(cartItems)
    .set({ quantity, unitPrice: row.variant.price })
    .where(eq(cartItems.id, itemId));

  await db
    .update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cart.id));

  return getCart(userId);
}

export async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
  return getCart(userId);
}

export async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  return getCart(userId);
}
