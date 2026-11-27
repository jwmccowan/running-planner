import { describe, expect, it } from "vitest";
import { applyPlanSettings, isMonday, planEndDate, weeksBetween } from "./plan-settings";
import type { PlanSettingsFields } from "./plan-settings";
import type { Activity } from "./types";

function run(id: string, date: string): Activity {
  return { id, name: "Easy run", date, distance: 5, intenseDistance: 0, type: "run", runType: "easy" };
}

// 4 weeks starting Mon 2026-12-07, one run per week, a block bar at week 3
const plan: PlanSettingsFields = {
  startDate: "2026-12-07",
  weekCount: 4,
  activities: [
    run("w1", "2026-12-08"),
    run("w2", "2026-12-15"),
    run("w3", "2026-12-22"),
    run("w4", "2026-12-29"),
  ],
  blockStarts: ["2026-12-21"],
};

const dates = (activities: Activity[]) => activities.map((a) => a.date);

describe("date helpers", () => {
  it("checks for Mondays", () => {
    expect(isMonday("2026-12-07")).toBe(true);
    expect(isMonday("2026-12-08")).toBe(false);
  });

  it("ends a plan on the Sunday of its last week", () => {
    expect(planEndDate("2026-12-07", 4)).toBe("2027-01-03");
  });

  it("counts whole weeks between Mondays", () => {
    expect(weeksBetween("2026-12-07", "2026-11-23")).toBe(-2);
    expect(weeksBetween("2026-12-07", "2026-12-21")).toBe(2);
  });
});

describe("applyPlanSettings", () => {
  it("changes nothing when settings are unchanged", () => {
    const { result, removed } = applyPlanSettings(plan, plan.startDate, plan.weekCount, true);
    expect(result).toEqual(plan);
    expect(removed).toEqual([]);
  });

  it("adds empty weeks at the end", () => {
    const { result, removed } = applyPlanSettings(plan, plan.startDate, 6, true);
    expect(result.weekCount).toBe(6);
    expect(result.activities).toEqual(plan.activities);
    expect(removed).toEqual([]);
  });

  it("removes activities in weeks dropped from the end", () => {
    const { result, removed } = applyPlanSettings(plan, plan.startDate, 2, true);
    expect(dates(result.activities)).toEqual(["2026-12-08", "2026-12-15"]);
    expect(removed.map((a) => a.id)).toEqual(["w3", "w4"]);
    expect(result.blockStarts).toEqual([]);
  });

  it("moves activities and block bars with the start date", () => {
    const { result, removed } = applyPlanSettings(plan, "2026-12-21", 4, true);
    expect(result.startDate).toBe("2026-12-21");
    expect(dates(result.activities)).toEqual(["2026-12-22", "2026-12-29", "2027-01-05", "2027-01-12"]);
    expect(result.blockStarts).toEqual(["2027-01-04"]);
    expect(removed).toEqual([]);
  });

  it("moves the plan earlier", () => {
    const { result } = applyPlanSettings(plan, "2026-11-23", 4, true);
    expect(dates(result.activities)).toEqual(["2026-11-24", "2026-12-01", "2026-12-08", "2026-12-15"]);
    expect(result.blockStarts).toEqual(["2026-12-07"]);
  });

  it("adds weeks before the plan without moving activities", () => {
    const { result, removed } = applyPlanSettings(plan, "2026-11-23", 6, false);
    expect(result.activities).toEqual(plan.activities);
    expect(result.blockStarts).toEqual(["2026-12-21"]);
    expect(removed).toEqual([]);
  });

  it("removes activities before a later start when not moving them", () => {
    const { result, removed } = applyPlanSettings(plan, "2026-12-14", 3, false);
    expect(removed.map((a) => a.id)).toEqual(["w1"]);
    expect(dates(result.activities)).toEqual(["2026-12-15", "2026-12-22", "2026-12-29"]);
  });

  it("drops a block bar that would land on the first week", () => {
    const { result } = applyPlanSettings(plan, "2026-12-21", 2, false);
    expect(result.blockStarts).toEqual([]);
  });

  it("reports removed activities with their original dates", () => {
    const { removed } = applyPlanSettings(plan, "2026-12-14", 3, true);
    expect(removed.map((a) => [a.id, a.date])).toEqual([["w4", "2026-12-29"]]);
  });
});
