import { eq } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import { shopSettings } from "../../db/schema/index.js";

const SINGLETON_ID = 1;

export async function getSettings() {
  const [row] = await db
    .select()
    .from(shopSettings)
    .where(eq(shopSettings.id, SINGLETON_ID))
    .limit(1);

  return row || null;
}

export async function upsertSettings(data) {
  const now = new Date();

  const [row] = await db
    .insert(shopSettings)
    .values({
      id: SINGLETON_ID,
      ...data,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: shopSettings.id,
      set: {
        ...data,
        updatedAt: now,
      },
    })
    .returning();

  return row;
}
