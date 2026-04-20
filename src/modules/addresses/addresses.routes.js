import { Router } from "express";
import asyncHandler from "../../common/middleware/async-handler.js";
import { validateDto } from "../../common/dto/base.dto.js";
import { authenticateAndCheckBan } from "../auth/auth.middleware.js";
import { upsertAddressSchema } from "./dto/upsert-address.dto.js";
import * as ctrl from "./addresses.controller.js";

const router = Router();
const auth = [asyncHandler(authenticateAndCheckBan)];

router.get("/api/addresses", ...auth, asyncHandler(ctrl.list));
router.get("/api/addresses/:id", ...auth, asyncHandler(ctrl.getOne));
router.post(
  "/api/addresses",
  ...auth,
  validateDto(upsertAddressSchema),
  asyncHandler(ctrl.create)
);
router.put(
  "/api/addresses/:id",
  ...auth,
  validateDto(upsertAddressSchema),
  asyncHandler(ctrl.update)
);
router.delete("/api/addresses/:id", ...auth, asyncHandler(ctrl.remove));
router.post("/api/addresses/:id/default", ...auth, asyncHandler(ctrl.setDefault));

export default router;
