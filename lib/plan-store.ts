import { mkdir, readdir, readFile, writeFile } from "fs/promises";
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

export type PlanListEntry = { id: string; plan: Plan } | { id: string; error: string };

export async function listPlans(): Promise<PlanListEntry[]> {
  let files: string[] = [];
  try {
    files = await readdir(DATA_DIR);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const ids = files.filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -".json".length));
  if (!ids.includes(seedPlan.id)) ids.push(seedPlan.id);

  return Promise.all(
    ids.map(async (id): Promise<PlanListEntry> => {
      try {
        const plan = await loadPlan(id);
        return plan ? { id, plan } : { id, error: `Plan ${id} not found` };
      } catch (error) {
        return { id, error: (error as Error).message };
      }
    })
  );
}

export async function createPlan(
  fields: Pick<Plan, "name" | "startDate" | "weekCount">
): Promise<Plan> {
  await mkdir(DATA_DIR, { recursive: true });
  const files = await readdir(DATA_DIR);
  const ids = [seedPlan.id, ...files.filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -".json".length))];
  let nextId = Math.max(0, ...ids.map(Number).filter(Number.isInteger)) + 1;

  for (;;) {
    const plan: Plan = {
      id: String(nextId),
      ...fields,
      activities: [],
      priorWeeklyDistances: [],
      blockStarts: [],
    };
    try {
      await writeFile(path.join(DATA_DIR, `${plan.id}.json`), JSON.stringify(plan, null, 2), {
        encoding: "utf-8",
        flag: "wx",
      });
      return plan;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      nextId++;
    }
  }
}

export async function savePlan(plan: Plan): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const filePath = path.join(DATA_DIR, `${plan.id}.json`);
  await writeFile(filePath, JSON.stringify(plan, null, 2), "utf-8");
}
