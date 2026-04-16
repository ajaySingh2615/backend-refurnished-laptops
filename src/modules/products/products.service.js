import {
  eq,
  and,
  asc,
  desc,
  sql,
  ilike,
  gte,
  lte,
  count,
  min,
  ne,
} from "drizzle-orm";
import { db } from "../../common/config/db.js";
import {
  products,
  productVariants,
  productImages,
  categories,
} from "../../db/schema/index.js";
import { slugify } from "../../common/utils/slug.utils.js";
import ApiError from "../../common/utils/api-error.js";

// ── Helpers ─────────────────────────────────────────────

async function ensureUniqueSlug(slug, excludeId = null) {
  let candidate = slug;
  let counter = 0;

  while (true) {
    const conditions = [eq(products.slug, candidate)];
    if (excludeId) {
      conditions.push(ne(products.id, excludeId));
    }

    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(...conditions))
      .limit(1);

    if (!existing) return candidate;
    counter++;
    candidate = `${slug}-${counter}`;
  }
}

// ── Public ──────────────────────────────────────────────

export async function listProducts(query) {
  const {
    category,
    brand,
    type,
    processor,
    ram,
    os,
    minPrice,
    maxPrice,
    featured,
    search,
    page,
    limit,
    sort,
  } = query;

  const conditions = [eq(products.isPublished, true)];

  if (category) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, category))
      .limit(1);

    if (cat) {
      conditions.push(eq(products.categoryId, cat.id));
    } else {
      return { items: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  if (brand) conditions.push(ilike(products.brand, brand));
  if (type) conditions.push(eq(products.type, type));
  if (processor) conditions.push(ilike(products.processor, `%${processor}%`));
  if (ram) conditions.push(eq(products.ram, ram));
  if (os) conditions.push(ilike(products.os, `%${os}%`));
  if (featured) conditions.push(eq(products.isFeatured, true));

  if (search) {
    conditions.push(
      sql`(${products.name} ILIKE ${"%" + search + "%"} OR ${products.brand} ILIKE ${"%" + search + "%"} OR ${products.description} ILIKE ${"%" + search + "%"})`
    );
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceSubquery = db
      .select({ productId: productVariants.productId })
      .from(productVariants)
      .where(
        and(
          eq(productVariants.isActive, true),
          ...(minPrice !== undefined
            ? [gte(productVariants.price, String(minPrice))]
            : []),
          ...(maxPrice !== undefined
            ? [lte(productVariants.price, String(maxPrice))]
            : [])
        )
      )
      .groupBy(productVariants.productId);

    conditions.push(sql`${products.id} IN (${priceSubquery})`);
  }

  const whereClause = and(...conditions);

  const [{ total }] = await db
    .select({ total: count() })
    .from(products)
    .where(whereClause);

  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  let orderBy;
  switch (sort) {
    case "price_asc":
      orderBy = asc(
        sql`(SELECT MIN(${productVariants.price}) FROM ${productVariants} WHERE ${productVariants.productId} = ${products.id} AND ${productVariants.isActive} = true)`
      );
      break;
    case "price_desc":
      orderBy = desc(
        sql`(SELECT MIN(${productVariants.price}) FROM ${productVariants} WHERE ${productVariants.productId} = ${products.id} AND ${productVariants.isActive} = true)`
      );
      break;
    case "name":
      orderBy = asc(products.name);
      break;
    default:
      orderBy = desc(products.createdAt);
  }

  const rows = await db
    .select()
    .from(products)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const productIds = rows.map((r) => r.id);
  let variantsMap = new Map();
  let imagesMap = new Map();

  if (productIds.length > 0) {
    const allVariants = await db
      .select()
      .from(productVariants)
      .where(
        sql`${productVariants.productId} IN ${productIds}`
      )
      .orderBy(asc(productVariants.sortOrder));

    for (const v of allVariants) {
      if (!variantsMap.has(v.productId)) variantsMap.set(v.productId, []);
      variantsMap.get(v.productId).push(v);
    }

    const allImages = await db
      .select()
      .from(productImages)
      .where(
        sql`${productImages.productId} IN ${productIds}`
      )
      .orderBy(asc(productImages.sortOrder));

    for (const img of allImages) {
      if (!imagesMap.has(img.productId)) imagesMap.set(img.productId, []);
      imagesMap.get(img.productId).push(img);
    }
  }

  const items = rows.map((p) => ({
    ...p,
    variants: variantsMap.get(p.id) || [],
    images: imagesMap.get(p.id) || [],
  }));

  return { items, total, page, limit, totalPages };
}

export async function getProductBySlug(slug) {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.slug, slug), eq(products.isPublished, true)))
    .limit(1);

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id))
    .orderBy(asc(productVariants.sortOrder));

  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder));

  return { ...product, variants, images };
}

// ── Admin — Products ────────────────────────────────────

export async function adminListProducts(query) {
  const { page = 1, limit = 20 } = query;

  const [{ total }] = await db.select({ total: count() }).from(products);

  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const rows = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  const productIds = rows.map((r) => r.id);
  let variantsMap = new Map();

  if (productIds.length > 0) {
    const allVariants = await db
      .select()
      .from(productVariants)
      .where(sql`${productVariants.productId} IN ${productIds}`)
      .orderBy(asc(productVariants.sortOrder));

    for (const v of allVariants) {
      if (!variantsMap.has(v.productId)) variantsMap.set(v.productId, []);
      variantsMap.get(v.productId).push(v);
    }
  }

  const items = rows.map((p) => ({
    ...p,
    variants: variantsMap.get(p.id) || [],
  }));

  return { items, total, page, limit, totalPages };
}

export async function createProduct(data) {
  const { variants: variantsData, ...productData } = data;

  const [cat] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, productData.categoryId))
    .limit(1);

  if (!cat) {
    throw ApiError.badRequest("Category not found");
  }

  const rawSlug = productData.slug || slugify(productData.name);
  productData.slug = await ensureUniqueSlug(rawSlug);

  const [product] = await db
    .insert(products)
    .values(productData)
    .returning();

  const variantRows = variantsData.map((v) => ({
    ...v,
    productId: product.id,
    price: String(v.price),
    compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : null,
  }));

  const createdVariants = await db
    .insert(productVariants)
    .values(variantRows)
    .returning();

  return { ...product, variants: createdVariants };
}

export async function updateProduct(id, data) {
  const [existing] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!existing) {
    throw ApiError.notFound("Product not found");
  }

  if (data.categoryId) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, data.categoryId))
      .limit(1);

    if (!cat) {
      throw ApiError.badRequest("Category not found");
    }
  }

  if (data.slug) {
    data.slug = await ensureUniqueSlug(data.slug, id);
  } else if (data.name && data.name !== existing.name) {
    data.slug = await ensureUniqueSlug(slugify(data.name), id);
  }

  data.updatedAt = new Date();

  const [updated] = await db
    .update(products)
    .set(data)
    .where(eq(products.id, id))
    .returning();

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, id))
    .orderBy(asc(productVariants.sortOrder));

  return { ...updated, variants };
}

export async function deleteProduct(id) {
  const [existing] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!existing) {
    throw ApiError.notFound("Product not found");
  }

  await db.delete(products).where(eq(products.id, id));
}

// ── Admin — Variants ────────────────────────────────────

export async function addVariant(productId, data) {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const [variant] = await db
    .insert(productVariants)
    .values({
      ...data,
      productId,
      price: String(data.price),
      compareAtPrice: data.compareAtPrice ? String(data.compareAtPrice) : null,
    })
    .returning();

  await db
    .update(products)
    .set({ updatedAt: new Date() })
    .where(eq(products.id, productId));

  return variant;
}

export async function updateVariant(productId, variantId, data) {
  const [variant] = await db
    .select()
    .from(productVariants)
    .where(
      and(
        eq(productVariants.id, variantId),
        eq(productVariants.productId, productId)
      )
    )
    .limit(1);

  if (!variant) {
    throw ApiError.notFound("Variant not found");
  }

  if (data.price !== undefined) data.price = String(data.price);
  if (data.compareAtPrice !== undefined)
    data.compareAtPrice = data.compareAtPrice
      ? String(data.compareAtPrice)
      : null;

  data.updatedAt = new Date();

  const [updated] = await db
    .update(productVariants)
    .set(data)
    .where(eq(productVariants.id, variantId))
    .returning();

  await db
    .update(products)
    .set({ updatedAt: new Date() })
    .where(eq(products.id, productId));

  return updated;
}

export async function deleteVariant(productId, variantId) {
  const [variant] = await db
    .select()
    .from(productVariants)
    .where(
      and(
        eq(productVariants.id, variantId),
        eq(productVariants.productId, productId)
      )
    )
    .limit(1);

  if (!variant) {
    throw ApiError.notFound("Variant not found");
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  if (total <= 1) {
    throw ApiError.conflict(
      "Cannot delete the last variant. Every product must have at least one."
    );
  }

  await db.delete(productVariants).where(eq(productVariants.id, variantId));

  await db
    .update(products)
    .set({ updatedAt: new Date() })
    .where(eq(products.id, productId));
}
