import { and, eq } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import {
  addresses,
  shippingMethods,
  shopSettings,
  productVariants,
} from "../../db/schema/index.js";
import * as cartService from "../cart/cart.service.js";
import {
  computeShippingCost,
  getById as getShippingMethod,
} from "../delivery/delivery.service.js";
import { computeTax } from "../tax/tax.service.js";
import ApiError from "../../common/utils/api-error.js";

export async function getShopSettings() {
  const [row] = await db.select().from(shopSettings).limit(1);
  if (!row) {
    throw ApiError.badRequest(
      "Shop settings not configured. Please set up shop details before checkout."
    );
  }
  return row;
}

export async function getAddressForUser(userId, addressId) {
  const [row] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .limit(1);
  if (!row) throw ApiError.notFound("Address not found");
  return row;
}

/**
 * Build a full price quote for the current cart.
 * Returns: { cart, address, shippingMethod, subtotal, shippingCost, tax: {...}, grandTotal }
 */
export async function quote({ userId, addressId, shippingMethodId }) {
  const [cart, address, shipping, shop] = await Promise.all([
    cartService.getCart(userId),
    getAddressForUser(userId, addressId),
    getShippingMethod(shippingMethodId),
    getShopSettings(),
  ]);

  if (!cart.items.length) {
    throw ApiError.badRequest("Your cart is empty");
  }

  // Revalidate stock + activeness
  const unavailable = cart.items.filter(
    (i) => !i.isActive || i.stock < i.quantity
  );
  if (unavailable.length) {
    throw ApiError.badRequest(
      `Some items are no longer available: ${unavailable
        .map((i) => i.productName)
        .join(", ")}`
    );
  }

  if (!shipping.isActive) {
    throw ApiError.badRequest("Selected shipping method is not available");
  }

  const shippingCost = computeShippingCost(shipping, cart.subtotal);

  const tax = computeTax({
    items: cart.items.map((i) => ({
      variantId: i.variantId,
      productName: i.productName,
      variantName: i.variantName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      gstPercent: i.gstPercent,
    })),
    shopState: shop.state,
    buyerState: address.state,
  });

  const grandTotal = Number((tax.subtotal + shippingCost).toFixed(2));

  return {
    cart,
    address,
    shippingMethod: shipping,
    shop: {
      state: shop.state,
      shopName: shop.shopName,
      gstin: shop.gstin,
    },
    subtotal: tax.subtotal,
    taxableValue: tax.taxableValue,
    cgst: tax.cgst,
    sgst: tax.sgst,
    igst: tax.igst,
    taxTotal: tax.taxTotal,
    intraState: tax.intraState,
    shippingCost,
    grandTotal,
    items: tax.perItem,
  };
}
