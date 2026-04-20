import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import { addresses } from "../../db/schema/index.js";
import ApiError from "../../common/utils/api-error.js";

export async function listMyAddresses(userId) {
  return db
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
}

export async function getMyAddress(userId, addressId) {
  const [row] = await db
    .select()
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .limit(1);

  if (!row) throw ApiError.notFound("Address not found");
  return row;
}

async function clearOtherDefaults(userId, exceptId = null) {
  const where = exceptId
    ? and(eq(addresses.userId, userId), ne(addresses.id, exceptId))
    : eq(addresses.userId, userId);

  await db
    .update(addresses)
    .set({ isDefault: false })
    .where(where);
}

export async function createAddress(userId, data) {
  const existing = await db
    .select({ id: addresses.id })
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .limit(1);

  const shouldBeDefault = data.isDefault || existing.length === 0;

  if (shouldBeDefault) await clearOtherDefaults(userId);

  const [row] = await db
    .insert(addresses)
    .values({ ...data, userId, isDefault: shouldBeDefault })
    .returning();

  return row;
}

export async function updateAddress(userId, addressId, data) {
  const existing = await getMyAddress(userId, addressId);

  if (data.isDefault) {
    await clearOtherDefaults(userId, addressId);
  }

  const [row] = await db
    .update(addresses)
    .set({ ...data })
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .returning();

  return row || existing;
}

export async function deleteAddress(userId, addressId) {
  const target = await getMyAddress(userId, addressId);

  await db
    .delete(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)));

  if (target.isDefault) {
    const [next] = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.createdAt))
      .limit(1);

    if (next) {
      await db
        .update(addresses)
        .set({ isDefault: true })
        .where(eq(addresses.id, next.id));
    }
  }
}

export async function setDefault(userId, addressId) {
  await getMyAddress(userId, addressId);
  await clearOtherDefaults(userId, addressId);

  const [row] = await db
    .update(addresses)
    .set({ isDefault: true })
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .returning();

  return row;
}
