import { eq, and, asc } from "drizzle-orm";
import { db } from "../../common/config/db.js";
import { products, productImages, productVariants } from "../../db/schema/index.js";
import cloudinary from "../../common/config/cloudinary.js";
import ApiError from "../../common/utils/api-error.js";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

async function assertProductExists(productId) {
  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) throw ApiError.notFound("Product not found");
  return product;
}

async function assertVariantBelongsToProduct(productId, variantId) {
  const [row] = await db
    .select({ id: productVariants.id })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.id, variantId),
        eq(productVariants.productId, productId)
      )
    )
    .limit(1);

  if (!row) {
    throw ApiError.badRequest("Variant does not belong to this product");
  }
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

// ── Upload ──────────────────────────────────────────────

export async function uploadProductImage(productId, file, fields) {
  await assertProductExists(productId);

  let variantId = fields.variantId || null;
  if (variantId === "" || variantId === undefined) variantId = null;
  if (variantId) {
    await assertVariantBelongsToProduct(productId, variantId);
  }

  if (!file) throw ApiError.badRequest("Image file is required");
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    throw ApiError.badRequest("Only JPEG, PNG, and WebP images are allowed");
  }
  if (file.size > MAX_BYTES) {
    throw ApiError.badRequest("Image must be under 5 MB");
  }

  const result = await uploadBuffer(file.buffer, {
    folder: `refurbished-laptops/products/${productId}`,
    resource_type: "image",
  });

  const [image] = await db
    .insert(productImages)
    .values({
      productId,
      variantId,
      url: result.secure_url,
      cloudinaryPublicId: result.public_id,
      altText: fields.altText || null,
      sortOrder: fields.sortOrder ?? 0,
    })
    .returning();

  return image;
}

// ── Update metadata ─────────────────────────────────────

export async function updateProductImage(productId, imageId, data) {
  await assertProductExists(productId);

  const patch = { ...data };
  if (patch.variantId === "" || patch.variantId === undefined) {
    patch.variantId = null;
  }
  if (patch.variantId) {
    await assertVariantBelongsToProduct(productId, patch.variantId);
  }

  const [image] = await db
    .select()
    .from(productImages)
    .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)))
    .limit(1);

  if (!image) throw ApiError.notFound("Image not found");

  const [updated] = await db
    .update(productImages)
    .set(patch)
    .where(eq(productImages.id, imageId))
    .returning();

  return updated;
}

// ── Delete ──────────────────────────────────────────────

export async function deleteProductImage(productId, imageId) {
  await assertProductExists(productId);

  const [image] = await db
    .select()
    .from(productImages)
    .where(and(eq(productImages.id, imageId), eq(productImages.productId, productId)))
    .limit(1);

  if (!image) throw ApiError.notFound("Image not found");

  if (image.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(image.cloudinaryPublicId);
  }

  await db.delete(productImages).where(eq(productImages.id, imageId));
}

// ── List (useful for admin) ─────────────────────────────

export async function listProductImages(productId) {
  await assertProductExists(productId);

  return db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder));
}
