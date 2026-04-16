import ApiResponse from "../../common/utils/api-response.js";
import ApiError from "../../common/utils/api-error.js";
import * as shopSettingsService from "./shop-settings.service.js";

export async function getSettings(req, res) {
  const settings = await shopSettingsService.getSettings();

  if (!settings) {
    throw ApiError.notFound("Shop settings have not been configured yet");
  }

  return ApiResponse.ok(res, "Shop settings", settings);
}

export async function upsertSettings(req, res) {
  const settings = await shopSettingsService.upsertSettings(req.body);
  return ApiResponse.ok(res, "Shop settings saved", settings);
}
