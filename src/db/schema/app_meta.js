import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Minimal table so Drizzle migrations have a baseline.
 * Reuse or replace when shop settings / app config tables are added (module 03).
 */
export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
