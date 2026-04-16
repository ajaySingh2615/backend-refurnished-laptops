import { pgTable, uuid, integer, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { productVariants } from "./product_variants.js";
import { users } from "./users.js";

export const stockAdjustments = pgTable("stock_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
  adjustedBy: uuid("adjusted_by")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  quantityChange: integer("quantity_change").notNull(),
  stockAfter: integer("stock_after").notNull(),
  reason: varchar("reason", { length: 30 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stockAdjustmentsRelations = relations(stockAdjustments, ({ one }) => ({
  variant: one(productVariants, {
    fields: [stockAdjustments.variantId],
    references: [productVariants.id],
  }),
  adjustedByUser: one(users, {
    fields: [stockAdjustments.adjustedBy],
    references: [users.id],
  }),
}));
