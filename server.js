import "dotenv/config";
import app from "./src/app.js";
import { connectDB } from "./src/common/config/db.js";

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(
      `Server listening on http://localhost:${PORT} (${process.env.NODE_ENV || "development"})`,
    );
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
