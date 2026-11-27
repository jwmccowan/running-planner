// Gives plans with no owner (e.g. after pnpm db:import) to a user. They must have signed in once.
// Usage: pnpm db:claim <email> [plan-id ...]   (no IDs = every unowned plan)
import { existsSync } from "fs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const { getDb } = await import("../lib/db");
const { claimUnownedPlans, findUserIdByEmail } = await import("../lib/plan-store");

const [email, ...planIds] = process.argv.slice(2);
if (!email) {
  console.error("Usage: pnpm db:claim <email> [plan-id ...]");
  process.exit(1);
}

const db = getDb();
const userId = await findUserIdByEmail(db, email);
if (!userId) {
  console.error(`No user with email ${email}. Sign in to the app once first.`);
  process.exit(1);
}

const claimed = await claimUnownedPlans(db, userId, planIds.length > 0 ? planIds : undefined);
console.log(claimed.length > 0 ? `Claimed for ${email}: ${claimed.join(", ")}` : "No unowned plans to claim.");
process.exit(0);
