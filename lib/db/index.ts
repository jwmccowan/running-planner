import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { withStrictSsl } from "./connection-url";
import * as schema from "./schema";

// Satisfied by both node-postgres (the app) and PGlite (tests)
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const globalForDb = globalThis as unknown as { db?: Db };

export function getDb(): Db {
  if (!globalForDb.db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. See .env.example.");
    globalForDb.db = drizzle(withStrictSsl(url), { schema });
  }
  return globalForDb.db;
}
