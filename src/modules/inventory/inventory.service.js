import { eq, and, lte, asc, desc, count, sql } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import {
  productVariants,
  products,
  stockAdjustments,
  inventoryUnits,
} from "../../db/schema/index.js";
import ApiError from "../../common/utils/api-error.js";

// ── Helpers ─────────────────────────────────────────────

async function syncVariantStock(variantId) {
  const [{ available }] = await db
    .select({ available: count() })
    .from(inventoryUnits)
    .where(
      and(
        eq(inventoryUnits.variantId, variantId),
        eq(inventoryUnits.status, "available")
      )
    );

  const newStock = Number(available);

  await db
    .update(productVariants)
    .set({ stock: newStock, updatedAt: new Date() })
    .where(eq(productVariants.id, variantId));

  return newStock;
}

async function logAdjustment(variantId, userId, quantityChange, stockAfter, reason, notes) {
  await db.insert(stockAdjustments).values({
    variantId,
    adjustedBy: userId,
    quantityChange,
    stockAfter,
    reason,
    notes: notes || null,
  });
}

// ── Low stock ───────────────────────────────────────────

export async function getLowStockVariants() {
  const rows = await db
    .select({
      variantId: productVariants.id,
      variantName: productVariants.name,
      sku: productVariants.sku,
      stock: productVariants.stock,
      lowStockThreshold: productVariants.lowStockThreshold,
      productId: products.id,
      productName: products.name,
      brand: products.brand,
      type: products.type,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      sql`${productVariants.stock} <= ${productVariants.lowStockThreshold}`
    )
    .orderBy(asc(productVariants.stock));

  return rows;
}

// ── Stock adjustment (accessories) ──────────────────────

export async function adjustStock(variantId, userId, data) {
  const { quantity, reason, notes } = data;

  const [variant] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);

  if (!variant) {
    throw ApiError.notFound("Variant not found");
  }

  const newStock = variant.stock + quantity;

  if (newStock < 0) {
    throw ApiError.badRequest(
      `Insufficient stock. Current: ${variant.stock}, adjustment: ${quantity}`
    );
  }

  await db
    .update(productVariants)
    .set({ stock: newStock, updatedAt: new Date() })
    .where(eq(productVariants.id, variantId));

  await logAdjustment(variantId, userId, quantity, newStock, reason, notes);

  return { variantId, previousStock: variant.stock, newStock, quantity, reason };
}

// ── Adjustment history ──────────────────────────────────

export async function getAdjustmentHistory(variantId) {
  const [variant] = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);

  if (!variant) {
    throw ApiError.notFound("Variant not found");
  }

  const rows = await db
    .select()
    .from(stockAdjustments)
    .where(eq(stockAdjustments.variantId, variantId))
    .orderBy(desc(stockAdjustments.createdAt));

  return rows;
}

// ── Serial units — list ─────────────────────────────────

export async function listUnits(variantId) {
  const [variant] = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);

  if (!variant) {
    throw ApiError.notFound("Variant not found");
  }

  const rows = await db
    .select()
    .from(inventoryUnits)
    .where(eq(inventoryUnits.variantId, variantId))
    .orderBy(desc(inventoryUnits.createdAt));

  return rows;
}

// ── Serial units — create ───────────────────────────────

export async function createUnit(variantId, userId, data) {
  const [variant] = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);

  if (!variant) {
    throw ApiError.notFound("Variant not found");
  }

  const [existingSerial] = await db
    .select({ id: inventoryUnits.id })
    .from(inventoryUnits)
    .where(eq(inventoryUnits.serialNumber, data.serialNumber))
    .limit(1);

  if (existingSerial) {
    throw ApiError.conflict(`Serial number "${data.serialNumber}" already exists`);
  }

  const [unit] = await db
    .insert(inventoryUnits)
    .values({
      variantId,
      serialNumber: data.serialNumber,
      conditionGrade: data.conditionGrade,
      conditionNotes: data.conditionNotes || null,
      status: data.status || "available",
    })
    .returning();

  const newStock = await syncVariantStock(variantId);

  const quantityChange = unit.status === "available" ? 1 : 0;
  if (quantityChange !== 0) {
    await logAdjustment(variantId, userId, quantityChange, newStock, "restock", `Unit added: ${data.serialNumber}`);
  }

  return unit;
}

// ── Serial units — update ───────────────────────────────

export async function updateUnit(unitId, userId, data) {
  const [unit] = await db
    .select()
    .from(inventoryUnits)
    .where(eq(inventoryUnits.id, unitId))
    .limit(1);

  if (!unit) {
    throw ApiError.notFound("Unit not found");
  }

  const oldStatus = unit.status;
  const updateData = { ...data, updatedAt: new Date() };

  if (data.status === "sold" && oldStatus !== "sold") {
    updateData.soldAt = new Date();
  }
  if (data.status && data.status !== "sold" && oldStatus === "sold") {
    updateData.soldAt = null;
  }

  const [updated] = await db
    .update(inventoryUnits)
    .set(updateData)
    .where(eq(inventoryUnits.id, unitId))
    .returning();

  if (data.status && data.status !== oldStatus) {
    const newStock = await syncVariantStock(unit.variantId);

    let reason = "correction";
    if (data.status === "sold") reason = "sale";
    else if (data.status === "returned" || data.status === "available") reason = "return";
    else if (data.status === "reserved") reason = "reserved";

    const wasAvailable = oldStatus === "available";
    const isAvailable = data.status === "available";
    let quantityChange = 0;
    if (wasAvailable && !isAvailable) quantityChange = -1;
    if (!wasAvailable && isAvailable) quantityChange = 1;

    if (quantityChange !== 0) {
      await logAdjustment(unit.variantId, userId, quantityChange, newStock, reason, `Unit ${unit.serialNumber}: ${oldStatus} -> ${data.status}`);
    }
  }

  return updated;
}

// ── Serial units — delete ───────────────────────────────

export async function deleteUnit(unitId, userId) {
  const [unit] = await db
    .select()
    .from(inventoryUnits)
    .where(eq(inventoryUnits.id, unitId))
    .limit(1);

  if (!unit) {
    throw ApiError.notFound("Unit not found");
  }

  if (unit.status !== "available") {
    throw ApiError.conflict(
      `Cannot delete unit with status "${unit.status}". Only "available" units can be removed.`
    );
  }

  await db.delete(inventoryUnits).where(eq(inventoryUnits.id, unitId));

  const newStock = await syncVariantStock(unit.variantId);

  await logAdjustment(unit.variantId, userId, -1, newStock, "correction", `Unit removed: ${unit.serialNumber}`);
}
