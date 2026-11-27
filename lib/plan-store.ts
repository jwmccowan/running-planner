import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "./db";
import { activities, plans } from "./db/schema";
import type { Activity, Plan } from "./types";

export class PlanConflictError extends Error {
  constructor(planId: string) {
    super(`Plan ${planId} was changed or deleted since it was loaded`);
    this.name = "PlanConflictError";
  }
}

type PlanRow = typeof plans.$inferSelect;
type ActivityRow = typeof activities.$inferSelect;

function toActivity(row: ActivityRow): Activity {
  const base = {
    id: row.id,
    name: row.name,
    date: row.date,
    distance: row.distance,
    intenseDistance: row.intenseDistance,
    ...(row.status ? { status: row.status } : {}),
  };
  return row.type === "run"
    ? { ...base, type: "run", runType: row.runType ?? "easy" }
    : { ...base, type: "gym" };
}

function toActivityRow(planId: string, a: Activity): typeof activities.$inferInsert {
  return {
    planId,
    id: a.id,
    date: a.date,
    type: a.type,
    runType: a.type === "run" ? a.runType : null,
    name: a.name,
    distance: a.distance,
    intenseDistance: a.intenseDistance,
    status: a.status ?? null,
  };
}

function toPlan(row: PlanRow, planActivities: Activity[]): Plan {
  return {
    id: row.id,
    name: row.name,
    startDate: row.startDate,
    weekCount: row.weekCount,
    priorWeeklyDistances: row.priorWeeklyDistances,
    blockStarts: row.blockStarts,
    version: row.version,
    activities: planActivities,
  };
}

async function activitiesByPlan(db: Db, planIds: string[]): Promise<Map<string, Activity[]>> {
  const byPlan = new Map<string, Activity[]>(planIds.map((id) => [id, []]));
  if (planIds.length === 0) return byPlan;
  const rows = await db
    .select()
    .from(activities)
    .where(inArray(activities.planId, planIds))
    .orderBy(asc(activities.date));
  for (const row of rows) byPlan.get(row.planId)?.push(toActivity(row));
  return byPlan;
}

export async function loadPlan(db: Db, id: string): Promise<Plan | null> {
  const [row] = await db.select().from(plans).where(eq(plans.id, id));
  if (!row) return null;
  const byPlan = await activitiesByPlan(db, [id]);
  return toPlan(row, byPlan.get(id) ?? []);
}

export async function listPlans(db: Db): Promise<Plan[]> {
  const rows = await db.select().from(plans);
  const byPlan = await activitiesByPlan(
    db,
    rows.map((r) => r.id)
  );
  return rows.map((row) => toPlan(row, byPlan.get(row.id) ?? []));
}

export async function createPlan(
  db: Db,
  fields: Pick<Plan, "name" | "startDate" | "weekCount">
): Promise<Plan> {
  const [row] = await db
    .insert(plans)
    .values({ id: crypto.randomUUID(), ...fields })
    .returning();
  return toPlan(row, []);
}

// Saves only if the plan is still at plan.version; returns the new version.
export async function savePlan(db: Db, plan: Plan): Promise<number> {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(plans)
      .set({
        name: plan.name,
        startDate: plan.startDate,
        weekCount: plan.weekCount,
        priorWeeklyDistances: plan.priorWeeklyDistances,
        blockStarts: plan.blockStarts,
        version: sql`${plans.version} + 1`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(plans.id, plan.id), eq(plans.version, plan.version)))
      .returning({ version: plans.version });
    if (updated.length === 0) throw new PlanConflictError(plan.id);

    await tx.delete(activities).where(eq(activities.planId, plan.id));
    if (plan.activities.length > 0) {
      await tx.insert(activities).values(plan.activities.map((a) => toActivityRow(plan.id, a)));
    }
    return updated[0].version;
  });
}

// Inserts a plan with its existing ID (used to import plan files). Returns false if it already exists.
export async function importPlan(db: Db, plan: Omit<Plan, "version">): Promise<boolean> {
  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(plans)
      .values({
        id: plan.id,
        name: plan.name,
        startDate: plan.startDate,
        weekCount: plan.weekCount,
        priorWeeklyDistances: plan.priorWeeklyDistances,
        blockStarts: plan.blockStarts,
      })
      .onConflictDoNothing()
      .returning({ id: plans.id });
    if (inserted.length === 0) return false;
    if (plan.activities.length > 0) {
      await tx.insert(activities).values(plan.activities.map((a) => toActivityRow(plan.id, a)));
    }
    return true;
  });
}
