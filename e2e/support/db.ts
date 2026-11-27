import { drizzle } from "drizzle-orm/node-postgres";
import { withStrictSsl } from "../../lib/db/connection-url";
import * as schema from "../../lib/db/schema";
import { e2e } from "./env";

export const testDb = drizzle(withStrictSsl(e2e.databaseUrl), { schema });
