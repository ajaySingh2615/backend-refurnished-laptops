import ApiResponse from "../../common/utils/api-response.js";
import * as categoriesService from "./categories.service.js";

export async function getCategoryTree(req, res) {
  const tree = await categoriesService.getCategoryTree();
  return ApiResponse.ok(res, "Category tree", tree);
}

export async function getCategoryBySlug(req, res) {
  const category = await categoriesService.getCategoryBySlug(req.params.slug);
  return ApiResponse.ok(res, "Category details", category);
}

export async function listAllCategories(req, res) {
  const list = await categoriesService.listAllCategories();
  return ApiResponse.ok(res, "All categories", list);
}

export async function createCategory(req, res) {
  const category = await categoriesService.createCategory(req.body);
  return ApiResponse.created(res, "Category created", category);
}

export async function updateCategory(req, res) {
  const category = await categoriesService.updateCategory(
    req.params.id,
    req.body
  );
  return ApiResponse.ok(res, "Category updated", category);
}

export async function deleteCategory(req, res) {
  await categoriesService.deleteCategory(req.params.id);
  return ApiResponse.ok(res, "Category deleted");
}
