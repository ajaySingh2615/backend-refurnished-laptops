import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import * as healthController from "./health.controller.js";

const router = Router();

router.get("/health", asyncHandler(healthController.getHealth));
router.get("/api/health", asyncHandler(healthController.getHealth));

export default router;
