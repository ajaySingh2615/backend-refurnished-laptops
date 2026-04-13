import { pgTable, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";

export const shopSettings = pgTable("shop_settings", {
  id: integer("id").primaryKey().default(1),
  shopName: varchar("shop_name", { length: 255 }).notNull(),
  gstin: varchar("gstin", { length: 20 }).notNull(),
  pan: varchar("pan", { length: 15 }),
  address: text("address").notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  invoicePrefix: varchar("invoice_prefix", { length: 10 }).notNull().default("INV"),
  nextInvoiceNumber: integer("next_invoice_number").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
