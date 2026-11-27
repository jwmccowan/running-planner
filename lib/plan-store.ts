import { and, asc, count, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "./db";
import { activities, planMembers, plans, user } from "./db/schema";
import type { Activity, Plan } from "./types";

const DEFAULT_MAX_PLANS_PER_USER = 2;

export function maxPlansPerUser(): number {
  return Number(process.env.MAX_PLANS_PER_USER ?? DEFAULT_MAX_PLANS_PER_USER);
}

export class PlanConflictError extends Error {
  constructor(planId: string) {
    super(`Plan ${planId} was changed or deleted since it was loaded`);
    this.name = "PlanConflictError";
  }
}

export class PlanNotFoundError extends Error {
  constructor(planId: string) {
    super(`Plan ${planId} not found`);
    this.name = "PlanNotFoundError";
  }
}

export class PlanLimitError extends Error {
  constructor(limit: number) {
    super(`You can have at most ${limit} plans`);
    this.name = "PlanLimitError";
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

const isMember = (planId: string | typeof plans.id, userId: string) =>
  and(eq(planMembers.planId, planId), eq(planMembers.userId, userId));

// Plans you're not a member of are reported as not found.
export async function loadPlan(db: Db, id: string, userId: string): Promise<Plan | null> {
  const [row] = await db
    .select({ plan: plans })
    .from(plans)
    .innerJoin(planMembers, isMember(plans.id, userId))
    .where(eq(plans.id, id));
  if (!row) return null;
  const byPlan = await activitiesByPlan(db, [id]);
  return toPlan(row.plan, byPlan.get(id) ?? []);
}

export async function listPlans(db: Db, userId: string): Promise<Plan[]> {
  const rows = await db
    .select({ plan: plans })
    .from(plans)
    .innerJoin(planMembers, isMember(plans.id, userId));
  const byPlan = await activitiesByPlan(
    db,
    rows.map((r) => r.plan.id)
  );
  return rows.map(({ plan }) => toPlan(plan, byPlan.get(plan.id) ?? []));
}

export async function countOwnedPlans(db: Db, userId: string): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(planMembers)
    .where(and(eq(planMembers.userId, userId), eq(planMembers.role, "owner")));
  return row.n;
}

export async function createPlan(
  db: Db,
  fields: Pick<Plan, "name" | "startDate" | "weekCount">,
  userId: string
): Promise<Plan> {
  return db.transaction(async (tx) => {
    if ((await countOwnedPlans(tx, userId)) >= maxPlansPerUser()) {
      throw new PlanLimitError(maxPlansPerUser());
    }
    const [row] = await tx
      .insert(plans)
      .values({ id: crypto.randomUUID(), ...fields })
      .returning();
    await tx.insert(planMembers).values({ planId: row.id, userId, role: "owner" });
    return toPlan(row, []);
  });
}

// Only the owner can delete a plan; its activities and memberships go with it (cascade).
export async function deletePlan(db: Db, planId: string, userId: string): Promise<void> {
  const deleted = await db
    .delete(plans)
    .where(
      and(
        eq(plans.id, planId),
        sql`exists (select 1 from ${planMembers} where ${planMembers.planId} = ${plans.id} and ${planMembers.userId} = ${userId} and ${planMembers.role} = 'owner')`
      )
    )
    .returning({ id: plans.id });
  if (deleted.length === 0) throw new PlanNotFoundError(planId);
}

// Saves only if you can edit the plan and it's still at plan.version; returns the new version.
export async function savePlan(db: Db, plan: Plan, userId: string): Promise<number> {
  return db.transaction(async (tx) => {
    const [member] = await tx
      .select({ role: planMembers.role })
      .from(planMembers)
      .where(isMember(plan.id, userId));
    if (!member || member.role === "viewer") throw new PlanNotFoundError(plan.id);

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

// Gives plans with no members (e.g. freshly imported ones) to a user as owner. Returns the claimed IDs.
export async function claimUnownedPlans(db: Db, userId: string, planIds?: string[]): Promise<string[]> {
  return db.transaction(async (tx) => {
    const unowned = await tx
      .select({ id: plans.id })
      .from(plans)
      .leftJoin(planMembers, eq(planMembers.planId, plans.id))
      .where(and(isNull(planMembers.planId), planIds ? inArray(plans.id, planIds) : undefined));
    if (unowned.length === 0) return [];
    await tx
      .insert(planMembers)
      .values(unowned.map(({ id }) => ({ planId: id, userId, role: "owner" as const })));
    return unowned.map(({ id }) => id);
  });
}

export async function findUserIdByEmail(db: Db, email: string): Promise<string | null> {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(sql`lower(${user.email})`, email.toLowerCase()));
  return row?.id ?? null;
}
