import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { Plan } from "./types";
import { seedPlan } from "./seed-data";

const DATA_DIR = path.join(process.cwd(), "data", "plans");

export async function loadPlan(id: string): Promise<Plan | null> {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  let raw: string;
  try {
    raw = await readFile(filePath, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return id === seedPlan.id ? seedPlan : null;
  }
  try {
    return JSON.parse(raw) as Plan;
  } catch (error) {
    throw new Error(`Plan ${id} (${filePath}) is not valid JSON: ${(error as Error).message}`);
  }
}

export async function savePlan(plan: Plan): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, `${plan.id}.json`);
  await writeFile(filePath, JSON.stringify(plan, null, 2), "utf-8");
}
