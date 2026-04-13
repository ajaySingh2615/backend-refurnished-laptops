import { pingDatabase } from "../../common/config/db.js";

export async function getDatabaseStatus() {
  const up = await pingDatabase();
  return up ? "up" : "down";
}
