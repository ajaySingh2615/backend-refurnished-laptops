import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { productVariants } from "./product_variants.js";

export const inventoryUnits = pgTable("inventory_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
  serialNumber: varchar("serial_number", { length: 100 }).notNull().unique(),
  status: varchar("status", { length: 20 }).notNull().default("available"),
  conditionGrade: varchar("condition_grade", { length: 10 }).notNull(),
  conditionNotes: text("condition_notes"),
  soldAt: timestamp("sold_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const inventoryUnitsRelations = relations(inventoryUnits, ({ one }) => ({
  variant: one(productVariants, {
    fields: [inventoryUnits.variantId],
    references: [productVariants.id],
  }),
}));
