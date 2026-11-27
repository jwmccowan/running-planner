import { describe, expect, it } from "vitest";
import { planProblems, planSettingsProblems } from "./plan-validation";
import { seedPlan } from "./seed-data";
import type { Activity, Plan } from "./types";

const run = (id: string, date: string, extra: Partial<Activity> = {}): Activity =>
  ({ id, name: "Easy run", date, distance: 6, intenseDistance: 0, type: "run", runType: "easy", ...extra }) as Activity;

const plan = (overrides: Partial<Plan> = {}): Plan => ({
  id: "p",
  name: "Plan",
  startDate: "2026-12-07",
  weekCount: 4,
  priorWeeklyDistances: [],
  blockStarts: [],
  version: 1,
  activities: [],
  ...overrides,
});

describe("planSettingsProblems", () => {
  const ok = { name: "Spring", startDate: "2026-12-07", weekCount: 16 };

  it("accepts valid settings", () => {
    expect(planSettingsProblems(ok)).toEqual([]);
  });

  it("allows up to 52 weeks", () => {
    expect(planSettingsProblems({ ...ok, weekCount: 52 })).toEqual([]);
    expect(planSettingsProblems({ ...ok, weekCount: 53 })).toEqual(["Weeks must be a whole number from 1 to 52"]);
    expect(planSettingsProblems({ ...ok, weekCount: 0 })).toHaveLength(1);
    expect(planSettingsProblems({ ...ok, weekCount: 1.5 })).toHaveLength(1);
  });

  it("limits the name to 100 characters", () => {
    expect(planSettingsProblems({ ...ok, name: "x".repeat(100) })).toEqual([]);
    expect(planSettingsProblems({ ...ok, name: "x".repeat(101) })).toEqual([
      "Plan name must be at most 100 characters",
    ]);
    expect(planSettingsProblems({ ...ok, name: "  " })).toEqual(["Plan name can't be empty"]);
  });

  it("requires a Monday start", () => {
    expect(planSettingsProblems({ ...ok, startDate: "2026-12-08" })).toEqual(["Start date must be a Monday"]);
  });
});

describe("planProblems", () => {
  it("accepts the seed plan", () => {
    expect(planProblems(seedPlan)).toEqual([]);
  });

  it("allows 3 activities on a day but not 4", () => {
    const three = ["a", "b", "c"].map((id) => run(id, "2026-12-08"));
    expect(planProblems(plan({ activities: three }))).toEqual([]);
    expect(planProblems(plan({ activities: [...three, run("d", "2026-12-08")] }))).toEqual([
      "2026-12-08 has 4 activities (max 3 per day)",
    ]);
  });

  it("limits activity distance to 300 km and intense distance to the distance", () => {
    expect(planProblems(plan({ activities: [run("a", "2026-12-08", { distance: 300 })] }))).toEqual([]);
    expect(planProblems(plan({ activities: [run("a", "2026-12-08", { distance: 301 })] }))).toHaveLength(1);
    expect(planProblems(plan({ activities: [run("a", "2026-12-08", { distance: -1 })] }))).toHaveLength(1);
    expect(planProblems(plan({ activities: [run("a", "2026-12-08", { intenseDistance: 7 })] }))).toHaveLength(1);
  });

  it("limits activity names to 100 characters", () => {
    expect(planProblems(plan({ activities: [run("a", "2026-12-08", { name: "x".repeat(101) })] }))).toEqual([
      "Activity on 2026-12-08: name must be at most 100 characters",
    ]);
  });

  it("rejects activities outside the plan's weeks", () => {
    expect(planProblems(plan({ activities: [run("a", "2026-12-06")] }))).toEqual([
      "Activity on 2026-12-06 is outside the plan",
    ]);
    expect(planProblems(plan({ activities: [run("a", "2027-01-04")] }))).toHaveLength(1);
  });

  it("rejects unknown types, run types, statuses and duplicate ids", () => {
    expect(planProblems(plan({ activities: [run("a", "2026-12-08", { type: "swim" } as never)] }))).toHaveLength(1);
    expect(planProblems(plan({ activities: [run("a", "2026-12-08", { runType: "sprint" } as never)] }))).toHaveLength(1);
    expect(planProblems(plan({ activities: [run("a", "2026-12-08", { status: "skipped" } as never)] }))).toHaveLength(1);
    expect(planProblems(plan({ activities: [run("a", "2026-12-08"), run("a", "2026-12-09")] }))).toEqual([
      "Duplicate activity id a",
    ]);
  });

  it("limits prior weeks to 4 values of 0–2000 km", () => {
    expect(planProblems(plan({ priorWeeklyDistances: [40, 45, 50, 55] }))).toEqual([]);
    expect(planProblems(plan({ priorWeeklyDistances: [1, 2, 3, 4, 5] }))).toEqual(["At most 4 prior weeks"]);
    expect(planProblems(plan({ priorWeeklyDistances: [2001] }))).toHaveLength(1);
  });

  it("requires block bars on Mondays inside the plan, after the first week", () => {
    expect(planProblems(plan({ blockStarts: ["2026-12-21"] }))).toEqual([]);
    expect(planProblems(plan({ blockStarts: ["2026-12-07"] }))).toHaveLength(1);
    expect(planProblems(plan({ blockStarts: ["2026-12-22"] }))).toHaveLength(1);
    expect(planProblems(plan({ blockStarts: ["2027-01-04"] }))).toHaveLength(1);
  });
});
