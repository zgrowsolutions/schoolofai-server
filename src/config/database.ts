import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "./env";

export const pool = new Pool({
  connectionString: config.db_url,
  max: 10,
});

export const db = drizzle({
  client: pool,
  casing: "snake_case",
  logger: true,
});
