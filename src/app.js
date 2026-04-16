import express from "express";
import cors from "cors";
import healthRoutes from "./modules/health/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import shopSettingsRoutes from "./modules/shop-settings/shop-settings.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";
import notFoundHandler from "./common/middleware/not-found.middleware.js";
import errorHandler from "./common/middleware/error.middleware.js";

function buildCorsOptions() {
  const raw = process.env.CORS_ORIGIN ?? "";
  const origins = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    origin: origins.length ? origins : false,
    credentials: true,
  };
}

const app = express();

app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(healthRoutes);
app.use(authRoutes);
app.use(shopSettingsRoutes);
app.use(categoriesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
