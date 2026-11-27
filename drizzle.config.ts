import { existsSync } from "fs";
import { defineConfig } from "drizzle-kit";
import { withStrictSsl } from "./lib/db/connection-url";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations use the direct connection when the host provides one (Neon's pooler doesn't suit DDL)
  dbCredentials: { url: withStrictSsl(process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "") },
});
