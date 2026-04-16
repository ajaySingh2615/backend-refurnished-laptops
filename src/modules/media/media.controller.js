import ApiResponse from "../../common/utils/api-response.js";
import * as mediaService from "./media.service.js";

export async function uploadImage(req, res) {
  const image = await mediaService.uploadProductImage(
    req.params.productId,
    req.file,
    req.body
  );
  return ApiResponse.created(res, "Image uploaded", image);
}

export async function updateImage(req, res) {
  const image = await mediaService.updateProductImage(
    req.params.productId,
    req.params.imageId,
    req.body
  );
  return ApiResponse.ok(res, "Image updated", image);
}

export async function deleteImage(req, res) {
  await mediaService.deleteProductImage(req.params.productId, req.params.imageId);
  return ApiResponse.ok(res, "Image deleted");
}
