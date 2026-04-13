import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { categories } from "./categories.js";
import { productVariants } from "./product_variants.js";
import { productImages } from "./product_images.js";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 280 }).notNull().unique(),
  description: text("description"),
  type: varchar("type", { length: 20 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  hsnCode: varchar("hsn_code", { length: 20 }),
  gstPercent: decimal("gst_percent", { precision: 5, scale: 2 })
    .notNull()
    .default("18.00"),
  isPublished: boolean("is_published").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),

  // Laptop-specific (nullable, only when type = 'laptop')
  processor: varchar("processor", { length: 100 }),
  ram: varchar("ram", { length: 50 }),
  storage: varchar("storage", { length: 50 }),
  display: varchar("display", { length: 100 }),
  gpu: varchar("gpu", { length: 100 }),
  os: varchar("os", { length: 50 }),
  conditionGrade: varchar("condition_grade", { length: 20 }),
  warrantyMonths: integer("warranty_months"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
  images: many(productImages),
}));
