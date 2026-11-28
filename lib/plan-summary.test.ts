import { describe, expect, it } from "vitest";
import { planStatus, sortPlanSummaries, summarizePlan } from "./plan-summary";
import type { Activity, Plan } from "./types";

function run(date: string, distance: number, status?: Activity["status"]): Activity {
  return { id: `${date}-${distance}`, name: "Run", date, distance, intenseDistance: 0, type: "run", runType: "easy", status };
}

function plan(id: string, startDate: string, weekCount: number, activities: Activity[] = []): Plan {
  return { id, name: `Plan ${id}`, startDate, weekCount, activities, priorWeeklyDistances: [], blockStarts: [], version: 1 };
}

describe("summarizePlan", () => {
  const p = plan("a", "2026-12-07", 2, [
    run("2026-12-08", 10),
    run("2026-12-15", 12),
    run("2026-12-16", 5, "missed"),
    run("2026-12-22", 99), // after the plan
    { id: "g", name: "Gym", date: "2026-12-09", distance: 0, intenseDistance: 0, type: "gym" },
  ]);

  it("ends on the Sunday of the last week", () => {
    expect(summarizePlan(p).endDate).toBe("2026-12-20");
  });

  it("totals run distance inside the plan, excluding missed runs", () => {
    expect(summarizePlan(p).totalDistance).toBe(22);
  });

  it("is upcoming before the start date", () => {
    expect(planStatus(summarizePlan(p), "2026-12-06")).toBe("upcoming");
  });

  it("is current from the start date through the last Sunday", () => {
    expect(planStatus(summarizePlan(p), "2026-12-07")).toBe("current");
    expect(planStatus(summarizePlan(p), "2026-12-20")).toBe("current");
  });

  it("is past after the last Sunday", () => {
    expect(planStatus(summarizePlan(p), "2026-12-21")).toBe("past");
  });
});

describe("sortPlanSummaries", () => {
  const today = "2026-11-27";
  const summaries = [
    plan("past-old", "2026-01-05", 4),
    plan("upcoming-late", "2027-06-07", 4),
    plan("current-late", "2026-11-23", 4),
    plan("past-recent", "2026-09-07", 4),
    plan("upcoming-soon", "2027-01-04", 4),
    plan("current-early", "2026-11-02", 8),
  ].map((p) => summarizePlan(p));

  it("orders current, then upcoming soonest first, then past most recent first", () => {
    expect(sortPlanSummaries(summaries, today).map((s) => s.id)).toEqual([
      "current-early",
      "current-late",
      "upcoming-soon",
      "upcoming-late",
      "past-recent",
      "past-old",
    ]);
  });
});
