import dotenv from "dotenv";
import path from "node:path";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const config = {
  node_env: process.env.NODE_ENV || "development",
  db_url: process.env.DATABASE_URL as string,
  port: process.env.PORT || 3000,
  admin_jwt_secret: process.env.ADMIN_JWT_SECRET || "default_admin_secret",
};
