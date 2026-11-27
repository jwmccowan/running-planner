import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Db } from "./db";
import * as schema from "./db/schema";
import {
  createPlan,
  importPlan,
  listPlans,
  loadPlan,
  PlanConflictError,
  savePlan,
} from "./plan-store";
import type { Activity, Plan } from "./types";

let db: Db;

beforeAll(async () => {
  const pglite = drizzle(new PGlite(), { schema });
  await migrate(pglite, { migrationsFolder: "drizzle" });
  db = pglite;
});

beforeEach(async () => {
  await db.execute(sql`truncate plans cascade`);
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
    const created = await createPlan(db, fields);
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created).toMatchObject({ ...fields, version: 1, activities: [], priorWeeklyDistances: [], blockStarts: [] });
    expect(await loadPlan(db, created.id)).toEqual(created);
  });

  it("returns null for a missing plan", async () => {
    expect(await loadPlan(db, "nope")).toBeNull();
  });

  it("rejects a start date that isn't a Monday", async () => {
    await expect(createPlan(db, { ...fields, startDate: "2026-12-08" })).rejects.toThrow();
  });
});

describe("savePlan", () => {
  it("round-trips every field, including run types, gym and status", async () => {
    const created = await createPlan(db, fields);
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
    const version = await savePlan(db, edited);
    expect(version).toBe(2);
    const loaded = await loadPlan(db, created.id);
    expect(loaded).toEqual({
      ...edited,
      version: 2,
      activities: [...edited.activities].sort((x, y) => x.date.localeCompare(y.date)),
    });
  });

  it("replaces activities on each save", async () => {
    const created = await createPlan(db, fields);
    const v2 = await savePlan(db, { ...created, activities: [run("a", "2026-12-08", 6), run("b", "2026-12-09", 8)] });
    await savePlan(db, { ...created, version: v2, activities: [run("b", "2026-12-09", 9)] });
    expect((await loadPlan(db, created.id))?.activities).toEqual([run("b", "2026-12-09", 9)]);
  });

  it("rejects a save from a stale version and keeps the newer data", async () => {
    const created = await createPlan(db, fields);
    await savePlan(db, { ...created, name: "From tab A" });
    await expect(savePlan(db, { ...created, name: "From stale tab B" })).rejects.toThrow(PlanConflictError);
    expect((await loadPlan(db, created.id))?.name).toBe("From tab A");
  });

  it("rejects saving a plan that doesn't exist", async () => {
    const created = await createPlan(db, fields);
    await expect(savePlan(db, { ...created, id: "missing" })).rejects.toThrow(PlanConflictError);
  });

  it("rolls back the whole save if an activity is invalid", async () => {
    const created = await createPlan(db, fields);
    const v2 = await savePlan(db, { ...created, activities: [run("a", "2026-12-08", 6)] });
    const invalid = run("x", "2026-12-08", 5, { intenseDistance: 9 });
    await expect(savePlan(db, { ...created, version: v2, name: "Bad", activities: [invalid] })).rejects.toThrow();
    const loaded = await loadPlan(db, created.id);
    expect(loaded).toMatchObject({ name: "Spring build", version: 2, activities: [run("a", "2026-12-08", 6)] });
  });
});

describe("listPlans", () => {
  it("lists every plan with its own activities", async () => {
    const a = await createPlan(db, fields);
    const b = await createPlan(db, { ...fields, name: "Other" });
    await savePlan(db, { ...a, activities: [run("1", "2026-12-08", 5)] });
    await savePlan(db, { ...b, activities: [run("1", "2026-12-08", 7), run("2", "2026-12-09", 3)] });
    const listed = new Map((await listPlans(db)).map((p) => [p.id, p.activities.length]));
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

  it("keeps the plan's existing ID", async () => {
    expect(await importPlan(db, file)).toBe(true);
    expect(await loadPlan(db, "3")).toMatchObject({ id: "3", version: 1, name: "2027 Summer build" });
  });

  it("skips a plan that's already imported", async () => {
    await importPlan(db, file);
    expect(await importPlan(db, { ...file, name: "Changed" })).toBe(false);
    expect((await loadPlan(db, "3"))?.name).toBe("2027 Summer build");
  });
});
