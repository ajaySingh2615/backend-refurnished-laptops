import { asc, eq } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import { shippingMethods } from "../../db/schema/index.js";
import ApiError from "../../common/utils/api-error.js";

export async function listActive() {
  return db
    .select()
    .from(shippingMethods)
    .where(eq(shippingMethods.isActive, true))
    .orderBy(asc(shippingMethods.baseCost), asc(shippingMethods.name));
}

export async function listAll() {
  return db
    .select()
    .from(shippingMethods)
    .orderBy(asc(shippingMethods.isPickup), asc(shippingMethods.baseCost));
}

export async function getById(id) {
  const [row] = await db
    .select()
    .from(shippingMethods)
    .where(eq(shippingMethods.id, id))
    .limit(1);

  if (!row) throw ApiError.notFound("Shipping method not found");
  return row;
}

export async function create(data) {
  const payload = {
    ...data,
    baseCost: String(data.baseCost),
    freeAbove:
      data.freeAbove === undefined || data.freeAbove === null
        ? null
        : String(data.freeAbove),
  };
  const [row] = await db.insert(shippingMethods).values(payload).returning();
  return row;
}

export async function update(id, data) {
  await getById(id);
  const payload = {
    ...data,
    ...(data.baseCost !== undefined ? { baseCost: String(data.baseCost) } : {}),
    ...(data.freeAbove !== undefined
      ? {
          freeAbove:
            data.freeAbove === null ? null : String(data.freeAbove),
        }
      : {}),
  };
  const [row] = await db
    .update(shippingMethods)
    .set(payload)
    .where(eq(shippingMethods.id, id))
    .returning();
  return row;
}

export async function remove(id) {
  await getById(id);
  await db.delete(shippingMethods).where(eq(shippingMethods.id, id));
}

/**
 * Computes the delivery cost for a given subtotal.
 * Returns 0 for pickup or when `freeAbove` threshold is met.
 */
export function computeShippingCost(method, subtotal) {
  if (!method) return 0;
  if (method.isPickup) return 0;
  const base = Number(method.baseCost);
  const threshold =
    method.freeAbove !== null && method.freeAbove !== undefined
      ? Number(method.freeAbove)
      : null;
  if (threshold !== null && subtotal >= threshold) return 0;
  return Number(base.toFixed(2));
}
