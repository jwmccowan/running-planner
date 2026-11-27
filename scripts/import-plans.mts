// Imports plan JSON files into Postgres, keeping their IDs. Plans already in the database are skipped.
// Usage: pnpm db:import [file-or-dir ...]   (default: data/plans)
import { existsSync } from "fs";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const { getDb } = await import("../lib/db");
const { importPlan } = await import("../lib/plan-store");

async function planFiles(target: string): Promise<string[]> {
  if (!(await stat(target)).isDirectory()) return [target];
  const names = await readdir(target);
  return names.filter((n) => n.endsWith(".json")).map((n) => path.join(target, n));
}

const targets = process.argv.slice(2);
const files = (await Promise.all((targets.length > 0 ? targets : ["data/plans"]).map(planFiles))).flat();
const db = getDb();
let failed = 0;

for (const file of files) {
  try {
    const { id, name, startDate, weekCount, priorWeeklyDistances, blockStarts, activities } = JSON.parse(
      await readFile(file, "utf-8")
    );
    const imported = await importPlan(db, {
      id,
      name,
      startDate,
      weekCount,
      priorWeeklyDistances: priorWeeklyDistances ?? [],
      blockStarts: blockStarts ?? [],
      activities,
    });
    console.log(
      imported
        ? `import ${file}: ${name} (${activities.length} activities)`
        : `skip   ${file}: ${name} (already in database)`
    );
  } catch (error) {
    failed++;
    console.error(`fail   ${file}: ${(error as Error).message}`);
  }
}

process.exit(failed > 0 ? 1 : 0);
