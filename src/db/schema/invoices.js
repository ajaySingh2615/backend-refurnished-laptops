import { pgTable, uuid, varchar, text, decimal, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders.js";

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: "cascade" }),
  invoiceNumber: varchar("invoice_number", { length: 30 }).notNull().unique(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  cgst: decimal("cgst", { precision: 10, scale: 2 }).notNull().default("0"),
  sgst: decimal("sgst", { precision: 10, scale: 2 }).notNull().default("0"),
  igst: decimal("igst", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 12, scale: 2 }).notNull(),
  buyerName: text("buyer_name").notNull(),
  buyerAddress: text("buyer_address").notNull(),
  buyerState: varchar("buyer_state", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invoicesRelations = relations(invoices, ({ one }) => ({
  order: one(orders, {
    fields: [invoices.orderId],
    references: [orders.id],
  }),
}));
