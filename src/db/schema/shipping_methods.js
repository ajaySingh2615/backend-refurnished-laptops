import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const shippingMethods = pgTable("shipping_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  baseCost: decimal("base_cost", { precision: 10, scale: 2 }).notNull(),
  freeAbove: decimal("free_above", { precision: 10, scale: 2 }),
  estimatedDays: varchar("estimated_days", { length: 30 }),
  isPickup: boolean("is_pickup").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
