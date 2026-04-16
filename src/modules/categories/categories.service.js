import { eq, asc, isNull, and, ne, count } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import { categories } from "../../db/schema/index.js";
import { products } from "../../db/schema/index.js";
import { slugify } from "../../common/utils/slug.utils.js";
import ApiError from "../../common/utils/api-error.js";

/**
 * Build a two-level tree from a flat list of categories.
 */
function buildTree(rows) {
  const topLevel = [];
  const childrenMap = new Map();

  for (const row of rows) {
    if (row.parentId) {
      if (!childrenMap.has(row.parentId)) {
        childrenMap.set(row.parentId, []);
      }
      childrenMap.get(row.parentId).push(row);
    } else {
      topLevel.push(row);
    }
  }

  return topLevel.map((parent) => ({
    ...parent,
    children: childrenMap.get(parent.id) || [],
  }));
}

/**
 * Ensure slug is unique; append a counter suffix if needed.
 */
async function ensureUniqueSlug(slug, excludeId = null) {
  let candidate = slug;
  let counter = 0;

  while (true) {
    const conditions = [eq(categories.slug, candidate)];
    if (excludeId) {
      conditions.push(ne(categories.id, excludeId));
    }

    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(...conditions))
      .limit(1);

    if (!existing) return candidate;

    counter++;
    candidate = `${slug}-${counter}`;
  }
}

// ── Public ──────────────────────────────────────────────

export async function getCategoryTree() {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.isActive, true))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return buildTree(rows);
}

export async function getCategoryBySlug(slug) {
  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1);

  if (!category) {
    throw ApiError.notFound("Category not found");
  }

  if (!category.parentId) {
    const children = await db
      .select()
      .from(categories)
      .where(
        and(eq(categories.parentId, category.id), eq(categories.isActive, true))
      )
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    return { ...category, children };
  }

  return category;
}

// ── Admin ───────────────────────────────────────────────

export async function listAllCategories() {
  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return rows;
}

export async function createCategory(data) {
  if (data.parentId) {
    const [parent] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, data.parentId))
      .limit(1);

    if (!parent) {
      throw ApiError.badRequest("Parent category not found");
    }
  }

  const rawSlug = data.slug || slugify(data.name);
  const slug = await ensureUniqueSlug(rawSlug);

  const [created] = await db
    .insert(categories)
    .values({ ...data, slug })
    .returning();

  return created;
}

export async function updateCategory(id, data) {
  const [existing] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (!existing) {
    throw ApiError.notFound("Category not found");
  }

  if (data.parentId) {
    if (data.parentId === id) {
      throw ApiError.badRequest("Category cannot be its own parent");
    }

    const [parent] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, data.parentId))
      .limit(1);

    if (!parent) {
      throw ApiError.badRequest("Parent category not found");
    }
  }

  if (data.slug) {
    data.slug = await ensureUniqueSlug(data.slug, id);
  } else if (data.name && data.name !== existing.name) {
    data.slug = await ensureUniqueSlug(slugify(data.name), id);
  }

  const [updated] = await db
    .update(categories)
    .set(data)
    .where(eq(categories.id, id))
    .returning();

  return updated;
}

export async function deleteCategory(id) {
  const [existing] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  if (!existing) {
    throw ApiError.notFound("Category not found");
  }

  const [childCount] = await db
    .select({ total: count() })
    .from(categories)
    .where(eq(categories.parentId, id));

  if (childCount.total > 0) {
    throw ApiError.conflict(
      "Cannot delete category with sub-categories. Remove children first."
    );
  }

  const [productCount] = await db
    .select({ total: count() })
    .from(products)
    .where(eq(products.categoryId, id));

  if (productCount.total > 0) {
    throw ApiError.conflict(
      "Cannot delete category with products. Reassign or remove products first."
    );
  }

  await db.delete(categories).where(eq(categories.id, id));
}
