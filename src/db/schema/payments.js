import { pgTable, uuid, varchar, decimal, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { orders } from "./orders.js";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  method: varchar("method", { length: 30 }).notNull(),
  gatewayOrderId: varchar("gateway_order_id", { length: 100 }),
  gatewayPaymentId: varchar("gateway_payment_id", { length: 100 }),
  status: varchar("status", { length: 30 }).notNull().default("pending"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));
