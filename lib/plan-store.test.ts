import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "./db";
import * as schema from "./db/schema";
import {
  claimUnownedPlans,
  countOwnedPlans,
  createPlan,
  deletePlan,
  findUserIdByEmail,
  importPlan,
  listPlans,
  loadPlan,
  PlanConflictError,
  PlanLimitError,
  PlanNotFoundError,
  savePlan,
} from "./plan-store";
import type { Activity, Plan } from "./types";

let db: Db;

beforeAll(async () => {
  const pglite = drizzle(new PGlite(), { schema });
  await migrate(pglite, { migrationsFolder: "drizzle" });
  db = pglite;
});

const ALICE = "alice";
const BOB = "bob";

beforeEach(async () => {
  await db.execute(sql`truncate plans, "user" cascade`);
  await db.insert(schema.user).values([
    { id: ALICE, name: "Alice", email: "Alice@Example.com" },
    { id: BOB, name: "Bob", email: "bob@example.com" },
  ]);
  process.env.MAX_PLANS_PER_USER = "2";
});

const run = (id: string, date: string, distance: number, extra: Partial<Activity> = {}): Activity =>
  ({ id, name: "Run", date, distance, intenseDistance: 0, type: "run", runType: "easy", ...extra }) as Activity;

const gym = (id: string, date: string): Activity => ({
  id,
  name: "Gym",
  date,
  distance: 0,
  intenseDistance: 0,
  type: "gym",
});

const fields = { name: "Spring build", startDate: "2026-12-07", weekCount: 8 };

describe("createPlan / loadPlan", () => {
  it("creates an empty plan with a UUID at version 1", async () => {
    const created = await createPlan(db, fields, ALICE);
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created).toMatchObject({ ...fields, version: 1, activities: [], priorWeeklyDistances: [], blockStarts: [] });
    expect(await loadPlan(db, created.id, ALICE)).toEqual(created);
  });

  it("returns null for a missing plan", async () => {
    expect(await loadPlan(db, "nope", ALICE)).toBeNull();
  });

  it("rejects a start date that isn't a Monday", async () => {
    await expect(createPlan(db, { ...fields, startDate: "2026-12-08" }, ALICE)).rejects.toThrow();
  });
});

describe("savePlan", () => {
  it("round-trips every field, including run types, gym and status", async () => {
    const created = await createPlan(db, fields, ALICE);
    const edited: Plan = {
      ...created,
      name: "Renamed",
      weekCount: 10,
      priorWeeklyDistances: [30, 32.5, 35, 28],
      blockStarts: ["2026-12-21", "2027-01-18"],
      activities: [
        run("a", "2026-12-08", 6),
        run("b", "2026-12-10", 10, { runType: "workout", intenseDistance: 4.5, status: "completed" }),
        run("c", "2026-12-13", 16, { runType: "long", status: "missed" }),
        gym("d", "2026-12-09"),
      ],
    };
    const version = await savePlan(db, edited, ALICE);
    expect(version).toBe(2);
    const loaded = await loadPlan(db, created.id, ALICE);
    expect(loaded).toEqual({
      ...edited,
      version: 2,
      activities: [...edited.activities].sort((x, y) => x.date.localeCompare(y.date)),
    });
  });

  it("replaces activities on each save", async () => {
    const created = await createPlan(db, fields, ALICE);
    const v2 = await savePlan(db, { ...created, activities: [run("a", "2026-12-08", 6), run("b", "2026-12-09", 8)] }, ALICE);
    await savePlan(db, { ...created, version: v2, activities: [run("b", "2026-12-09", 9)] }, ALICE);
    expect((await loadPlan(db, created.id, ALICE))?.activities).toEqual([run("b", "2026-12-09", 9)]);
  });

  it("rejects a save from a stale version and keeps the newer data", async () => {
    const created = await createPlan(db, fields, ALICE);
    await savePlan(db, { ...created, name: "From tab A" }, ALICE);
    await expect(savePlan(db, { ...created, name: "From stale tab B" }, ALICE)).rejects.toThrow(PlanConflictError);
    expect((await loadPlan(db, created.id, ALICE))?.name).toBe("From tab A");
  });

  it("rejects saving a plan that doesn't exist", async () => {
    const created = await createPlan(db, fields, ALICE);
    await expect(savePlan(db, { ...created, id: "missing" }, ALICE)).rejects.toThrow(PlanNotFoundError);
  });

  it("rolls back the whole save if an activity is invalid", async () => {
    const created = await createPlan(db, fields, ALICE);
    const v2 = await savePlan(db, { ...created, activities: [run("a", "2026-12-08", 6)] }, ALICE);
    const invalid = run("x", "2026-12-08", 5, { intenseDistance: 9 });
    await expect(savePlan(db, { ...created, version: v2, name: "Bad", activities: [invalid] }, ALICE)).rejects.toThrow();
    const loaded = await loadPlan(db, created.id, ALICE);
    expect(loaded).toMatchObject({ name: "Spring build", version: 2, activities: [run("a", "2026-12-08", 6)] });
  });
});

describe("listPlans", () => {
  it("lists every plan with its own activities", async () => {
    const a = await createPlan(db, fields, ALICE);
    const b = await createPlan(db, { ...fields, name: "Other" }, ALICE);
    await savePlan(db, { ...a, activities: [run("1", "2026-12-08", 5)] }, ALICE);
    await savePlan(db, { ...b, activities: [run("1", "2026-12-08", 7), run("2", "2026-12-09", 3)] }, ALICE);
    const listed = new Map((await listPlans(db, ALICE)).map((p) => [p.id, p.activities.length]));
    expect(listed).toEqual(new Map([[a.id, 1], [b.id, 2]]));
  });
});

describe("importPlan", () => {
  const file: Omit<Plan, "version"> = {
    id: "3",
    name: "2027 Summer build",
    startDate: "2026-11-23",
    weekCount: 18,
    priorWeeklyDistances: [47.5, 47.5, 32.5, 40.1],
    blockStarts: ["2026-12-07"],
    activities: [run("1", "2026-11-24", 6), gym("2", "2026-11-23")],
  };

  it("keeps the plan's existing ID, unowned until claimed", async () => {
    expect(await importPlan(db, file)).toBe(true);
    expect(await loadPlan(db, "3", ALICE)).toBeNull();
    expect(await claimUnownedPlans(db, ALICE)).toEqual(["3"]);
    expect(await loadPlan(db, "3", ALICE)).toMatchObject({ id: "3", version: 1, name: "2027 Summer build" });
  });

  it("skips a plan that's already imported", async () => {
    await importPlan(db, file);
    expect(await importPlan(db, { ...file, name: "Changed" })).toBe(false);
    await claimUnownedPlans(db, ALICE);
    expect((await loadPlan(db, "3", ALICE))?.name).toBe("2027 Summer build");
  });
});

describe("membership", () => {
  it("lists and loads only plans you're a member of", async () => {
    const mine = await createPlan(db, fields, ALICE);
    const theirs = await createPlan(db, { ...fields, name: "Bob's" }, BOB);
    expect((await listPlans(db, ALICE)).map((p) => p.id)).toEqual([mine.id]);
    expect((await listPlans(db, BOB)).map((p) => p.id)).toEqual([theirs.id]);
    expect(await loadPlan(db, theirs.id, ALICE)).toBeNull();
  });

  it("refuses to save someone else's plan and leaves it unchanged", async () => {
    const theirs = await createPlan(db, fields, BOB);
    await expect(savePlan(db, { ...theirs, name: "Hijacked" }, ALICE)).rejects.toThrow(PlanNotFoundError);
    expect((await loadPlan(db, theirs.id, BOB))?.name).toBe("Spring build");
  });

  it("refuses to save an unowned plan, so saving can't claim it", async () => {
    await importPlan(db, { ...fields, id: "orphan", priorWeeklyDistances: [], blockStarts: [], activities: [] });
    await expect(
      savePlan(db, { ...fields, id: "orphan", priorWeeklyDistances: [], blockStarts: [], activities: [], version: 1 }, ALICE)
    ).rejects.toThrow(PlanNotFoundError);
  });

  it("lets an editor save but not a viewer", async () => {
    const plan = await createPlan(db, fields, ALICE);
    await db.insert(schema.planMembers).values({ planId: plan.id, userId: BOB, role: "viewer" });
    await expect(savePlan(db, { ...plan, name: "By viewer" }, BOB)).rejects.toThrow(PlanNotFoundError);
    await db.update(schema.planMembers).set({ role: "editor" }).where(sql`user_id = ${BOB}`);
    await expect(savePlan(db, { ...plan, name: "By editor" }, BOB)).resolves.toBe(2);
  });

  it("deleting a user removes their memberships", async () => {
    const plan = await createPlan(db, fields, BOB);
    await db.delete(schema.user).where(sql`id = ${BOB}`);
    expect(await loadPlan(db, plan.id, BOB)).toBeNull();
  });
});

describe("plan limit", () => {
  it("counts only plans you own", async () => {
    const plan = await createPlan(db, fields, BOB);
    await db.insert(schema.planMembers).values({ planId: plan.id, userId: ALICE, role: "editor" });
    expect(await countOwnedPlans(db, ALICE)).toBe(0);
    expect(await countOwnedPlans(db, BOB)).toBe(1);
  });

  it("stops you creating more than MAX_PLANS_PER_USER plans", async () => {
    await createPlan(db, fields, ALICE);
    await createPlan(db, fields, ALICE);
    await expect(createPlan(db, fields, ALICE)).rejects.toThrow(PlanLimitError);
    await expect(createPlan(db, fields, BOB)).resolves.toBeDefined();
  });

  it("doesn't stop claiming plans beyond the limit", async () => {
    for (const id of ["a", "b", "c"]) {
      await importPlan(db, { ...fields, id, priorWeeklyDistances: [], blockStarts: [], activities: [] });
    }
    expect((await claimUnownedPlans(db, ALICE)).sort()).toEqual(["a", "b", "c"]);
    expect(await countOwnedPlans(db, ALICE)).toBe(3);
  });
});

describe("claimUnownedPlans", () => {
  const imported = (id: string) => ({ ...fields, id, priorWeeklyDistances: [], blockStarts: [], activities: [] });

  it("claims only the listed plans when given IDs", async () => {
    await importPlan(db, imported("x"));
    await importPlan(db, imported("y"));
    expect(await claimUnownedPlans(db, ALICE, ["x"])).toEqual(["x"]);
    expect(await claimUnownedPlans(db, BOB)).toEqual(["y"]);
  });

  it("never takes a plan that already has an owner", async () => {
    const plan = await createPlan(db, fields, BOB);
    expect(await claimUnownedPlans(db, ALICE, [plan.id])).toEqual([]);
    expect(await loadPlan(db, plan.id, ALICE)).toBeNull();
  });
});

describe("findUserIdByEmail", () => {
  it("matches emails case-insensitively", async () => {
    expect(await findUserIdByEmail(db, "alice@example.com")).toBe(ALICE);
    expect(await findUserIdByEmail(db, "nobody@example.com")).toBeNull();
  });
});

describe("deletePlan", () => {
  it("lets the owner delete a plan, with its activities and memberships", async () => {
    const plan = await createPlan(db, fields, ALICE);
    await savePlan(db, { ...plan, activities: [run("a", "2026-12-08", 6)] }, ALICE);
    await db.insert(schema.planMembers).values({ planId: plan.id, userId: BOB, role: "editor" });

    await deletePlan(db, plan.id, ALICE);

    expect(await loadPlan(db, plan.id, ALICE)).toBeNull();
    expect(await loadPlan(db, plan.id, BOB)).toBeNull();
    expect((await db.select().from(schema.activities)).length).toBe(0);
    expect((await db.select().from(schema.planMembers)).length).toBe(0);
  });

  it("refuses editors, viewers and strangers, and leaves the plan alone", async () => {
    const plan = await createPlan(db, fields, ALICE);
    await db.insert(schema.planMembers).values({ planId: plan.id, userId: BOB, role: "editor" });
    await expect(deletePlan(db, plan.id, BOB)).rejects.toThrow(PlanNotFoundError);
    await db.update(schema.planMembers).set({ role: "viewer" }).where(sql`user_id = ${BOB}`);
    await expect(deletePlan(db, plan.id, BOB)).rejects.toThrow(PlanNotFoundError);
    await expect(deletePlan(db, plan.id, "stranger")).rejects.toThrow(PlanNotFoundError);
    expect(await loadPlan(db, plan.id, ALICE)).not.toBeNull();
  });

  it("frees a slot under the plan limit", async () => {
    await createPlan(db, fields, ALICE);
    const second = await createPlan(db, fields, ALICE);
    await expect(createPlan(db, fields, ALICE)).rejects.toThrow(PlanLimitError);
    await deletePlan(db, second.id, ALICE);
    await expect(createPlan(db, fields, ALICE)).resolves.toBeDefined();
  });

  it("reports a missing plan as not found", async () => {
    await expect(deletePlan(db, "missing", ALICE)).rejects.toThrow(PlanNotFoundError);
  });
});
