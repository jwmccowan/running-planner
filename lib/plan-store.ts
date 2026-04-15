import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { Plan } from "./types";
import { seedPlan } from "./seed-data";

const DATA_DIR = path.join(process.cwd(), "data", "plans");

export async function loadPlan(id: string): Promise<Plan> {
  const filePath = path.join(DATA_DIR, `${id}.json`);
  try {
    const raw = await readFile(filePath, "utf-8");
    return JSON.parse(raw) as Plan;
  } catch {
    if (id === seedPlan.id) return seedPlan;
    throw new Error(`Plan ${id} not found`);
  }
}

export async function savePlan(plan: Plan): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, `${plan.id}.json`);
  await writeFile(filePath, JSON.stringify(plan, null, 2), "utf-8");
}
