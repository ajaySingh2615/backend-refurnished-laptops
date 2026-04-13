import ApiResponse from "../../common/utils/api-response.js";
import * as healthService from "./health.service.js";

export async function getHealth(_req, res) {
  const database = await healthService.getDatabaseStatus();
  ApiResponse.ok(res, "OK", {
    ok: true,
    uptime: process.uptime(),
    database,
  });
}
