import { asc, eq } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import { taxRates } from "../../db/schema/index.js";
import ApiError from "../../common/utils/api-error.js";

export async function listAll() {
  return db.select().from(taxRates).orderBy(asc(taxRates.rate));
}

export async function listActive() {
  return db
    .select()
    .from(taxRates)
    .where(eq(taxRates.isActive, true))
    .orderBy(asc(taxRates.rate));
}

export async function getById(id) {
  const [row] = await db
    .select()
    .from(taxRates)
    .where(eq(taxRates.id, id))
    .limit(1);
  if (!row) throw ApiError.notFound("Tax rate not found");
  return row;
}

export async function create(data) {
  const [row] = await db
    .insert(taxRates)
    .values({ ...data, rate: String(data.rate) })
    .returning();
  return row;
}

export async function update(id, data) {
  await getById(id);
  const payload = {
    ...data,
    ...(data.rate !== undefined ? { rate: String(data.rate) } : {}),
  };
  const [row] = await db
    .update(taxRates)
    .set(payload)
    .where(eq(taxRates.id, id))
    .returning();
  return row;
}

export async function remove(id) {
  await getById(id);
  await db.delete(taxRates).where(eq(taxRates.id, id));
}

// ── Calculator ─────────────────────────────────────────

function round2(n) {
  return Math.round(n * 100) / 100;
}

function normalizeState(s) {
  return (s || "").trim().toLowerCase();
}

/**
 * Compute GST breakdown. Prices are treated as **tax-inclusive** (standard retail in India).
 * For each item: net = lineTotal / (1 + gst/100). Tax = lineTotal - net.
 * Same state → CGST + SGST (50/50). Different state → IGST.
 *
 * @param {Array} items    { lineTotal: number, gstPercent: number }
 * @param {string} shopState
 * @param {string} buyerState
 * @returns { subtotal, taxableValue, cgst, sgst, igst, taxTotal, total, intraState, perItem }
 */
export function computeTax({ items, shopState, buyerState }) {
  const intraState =
    !!shopState &&
    !!buyerState &&
    normalizeState(shopState) === normalizeState(buyerState);

  let subtotal = 0;
  let taxable = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  const perItem = items.map((it) => {
    const gross = Number(it.lineTotal || 0);
    const rate = Number(it.gstPercent || 0);
    const net = rate > 0 ? gross / (1 + rate / 100) : gross;
    const tax = gross - net;

    subtotal += gross;
    taxable += net;

    let itemCgst = 0;
    let itemSgst = 0;
    let itemIgst = 0;

    if (rate > 0) {
      if (intraState) {
        itemCgst = tax / 2;
        itemSgst = tax / 2;
      } else {
        itemIgst = tax;
      }
    }

    cgst += itemCgst;
    sgst += itemSgst;
    igst += itemIgst;

    return {
      ...it,
      taxableValue: round2(net),
      gstAmount: round2(tax),
      cgst: round2(itemCgst),
      sgst: round2(itemSgst),
      igst: round2(itemIgst),
    };
  });

  return {
    subtotal: round2(subtotal),
    taxableValue: round2(taxable),
    cgst: round2(cgst),
    sgst: round2(sgst),
    igst: round2(igst),
    taxTotal: round2(cgst + sgst + igst),
    total: round2(subtotal),
    intraState,
    perItem,
  };
}
