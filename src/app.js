import express from "express";
import cors from "cors";
import healthRoutes from "./modules/health/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import shopSettingsRoutes from "./modules/shop-settings/shop-settings.routes.js";
import categoriesRoutes from "./modules/categories/categories.routes.js";
import productsRoutes from "./modules/products/products.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import mediaRoutes from "./modules/media/media.routes.js";
import addressesRoutes from "./modules/addresses/addresses.routes.js";
import cartRoutes from "./modules/cart/cart.routes.js";
import deliveryRoutes from "./modules/delivery/delivery.routes.js";
import taxRoutes from "./modules/tax/tax.routes.js";
import checkoutRoutes from "./modules/checkout/checkout.routes.js";
import ordersRoutes from "./modules/orders/orders.routes.js";
import paymentsRoutes from "./modules/payments/payments.routes.js";
import invoicesRoutes from "./modules/invoices/invoices.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
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
app.use(productsRoutes);
app.use(inventoryRoutes);
app.use(mediaRoutes);
app.use(addressesRoutes);
app.use(cartRoutes);
app.use(deliveryRoutes);
app.use(taxRoutes);
app.use(checkoutRoutes);
app.use(ordersRoutes);
app.use(paymentsRoutes);
app.use(invoicesRoutes);
app.use(adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
