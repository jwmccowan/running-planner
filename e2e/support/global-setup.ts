import { sql } from "drizzle-orm";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { testDb } from "./db";

export default async function globalSetup() {
  await migrate(testDb, { migrationsFolder: "drizzle" });
  await testDb.execute(sql`truncate plans, "user" cascade`);
  await testDb.$client.end();
}
