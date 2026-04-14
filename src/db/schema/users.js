import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { addresses } from "./addresses.js";
import { carts } from "./carts.js";
import { orders } from "./orders.js";
import { userSessions } from "./user_sessions.js";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }).unique(),
  googleId: varchar("google_id", { length: 100 }).unique(),
  avatarUrl: text("avatar_url"),
  authProvider: varchar("auth_provider", { length: 20 })
    .notNull()
    .default("phone"),
  role: varchar("role", { length: 20 }).notNull().default("customer"),
  isVerified: boolean("is_verified").notNull().default(true),
  isBanned: boolean("is_banned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  carts: many(carts),
  orders: many(orders),
  sessions: many(userSessions),
}));
