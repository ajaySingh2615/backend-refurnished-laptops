import ApiResponse from "../../common/utils/api-response.js";
import * as productsService from "./products.service.js";

// ── Public ──────────────────────────────────────────────

export async function listProducts(req, res) {
  const result = await productsService.listProducts(req.validatedQuery);
  return ApiResponse.ok(res, "Products", result);
}

export async function getProductBySlug(req, res) {
  const product = await productsService.getProductBySlug(req.params.slug);
  return ApiResponse.ok(res, "Product details", product);
}

// ── Admin — Products ────────────────────────────────────

export async function adminListProducts(req, res) {
  const result = await productsService.adminListProducts(req.query);
  return ApiResponse.ok(res, "All products", result);
}

export async function createProduct(req, res) {
  const product = await productsService.createProduct(req.body);
  return ApiResponse.created(res, "Product created", product);
}

export async function updateProduct(req, res) {
  const product = await productsService.updateProduct(req.params.id, req.body);
  return ApiResponse.ok(res, "Product updated", product);
}

export async function deleteProduct(req, res) {
  await productsService.deleteProduct(req.params.id);
  return ApiResponse.ok(res, "Product deleted");
}

// ── Admin — Variants ────────────────────────────────────

export async function addVariant(req, res) {
  const variant = await productsService.addVariant(req.params.id, req.body);
  return ApiResponse.created(res, "Variant added", variant);
}

export async function updateVariant(req, res) {
  const variant = await productsService.updateVariant(
    req.params.id,
    req.params.variantId,
    req.body
  );
  return ApiResponse.ok(res, "Variant updated", variant);
}

export async function deleteVariant(req, res) {
  await productsService.deleteVariant(req.params.id, req.params.variantId);
  return ApiResponse.ok(res, "Variant deleted");
}
