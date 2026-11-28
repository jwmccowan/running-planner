import { describe, expect, it } from "vitest";
import {
  addBlock,
  applySettings,
  canMoveActivity,
  canPlaceBlock,
  moveActivity,
  moveBlock,
  removeBlock,
  replaceDay,
  setActivityStatus,
  setPriorWeeks,
  type PlanEdits,
} from "./plan-edits";
import type { Activity } from "./types";

function run(id: string, date: string, distance = 5): Activity {
  return { id, name: "Easy run", date, distance, intenseDistance: 0, type: "run", runType: "easy" };
}

// 4 weeks starting Mon 2026-12-07, with a block starting in week 3 and a full Friday
const plan: PlanEdits = {
  name: "Winter build",
  startDate: "2026-12-07",
  weekCount: 4,
  priorWeeklyDistances: [20, 25],
  blockStarts: ["2026-12-21"],
  activities: [
    run("tue", "2026-12-08"),
    run("wed", "2026-12-09"),
    run("fri-1", "2026-12-11"),
    run("fri-2", "2026-12-11"),
    run("fri-3", "2026-12-11"),
  ],
};

const ids = (edits: PlanEdits) => edits.activities.map((a) => a.id);
const dateOf = (edits: PlanEdits, id: string) => edits.activities.find((a) => a.id === id)?.date;

describe("replaceDay", () => {
  it("replaces that day's activities and leaves other days alone", () => {
    const result = replaceDay(plan, "2026-12-08", [run("new", "2026-12-08", 10)]);
    expect(ids(result)).toEqual(["wed", "fri-1", "fri-2", "fri-3", "new"]);
    expect(plan.activities).toHaveLength(5);
  });

  it("clears the day when given no activities", () => {
    expect(ids(replaceDay(plan, "2026-12-11", []))).toEqual(["tue", "wed"]);
  });
});

describe("setActivityStatus", () => {
  it("sets and clears one activity's status", () => {
    const completed = setActivityStatus(plan, "tue", "completed");
    expect(completed.activities.find((a) => a.id === "tue")?.status).toBe("completed");
    expect(completed.activities.filter((a) => a.status !== undefined)).toHaveLength(1);
    expect(setActivityStatus(completed, "tue", undefined).activities.find((a) => a.id === "tue")?.status).toBeUndefined();
    expect(plan.activities[0].status).toBeUndefined();
  });
});

describe("moveActivity", () => {
  it("moves an activity to another day", () => {
    expect(canMoveActivity(plan, "tue", "2026-12-10")).toBe(true);
    const result = moveActivity(plan, "tue", "2026-12-10");
    expect(dateOf(result, "tue")).toBe("2026-12-10");
    expect(dateOf(plan, "tue")).toBe("2026-12-08");
  });

  it("allows a day up to the per-day limit", () => {
    const twoOnWed = moveActivity(plan, "tue", "2026-12-09");
    expect(dateOf(twoOnWed, "tue")).toBe("2026-12-09");
  });

  it("won't move onto a full day, onto its own day, or move an unknown activity", () => {
    for (const [id, date] of [
      ["tue", "2026-12-11"],
      ["tue", "2026-12-08"],
      ["missing", "2026-12-10"],
    ]) {
      expect(canMoveActivity(plan, id, date)).toBe(false);
      expect(moveActivity(plan, id, date)).toBe(plan);
    }
  });
});

describe("blocks", () => {
  it("can start on any week but the first, once per week", () => {
    expect(canPlaceBlock(plan, "2026-12-14")).toBe(true);
    expect(canPlaceBlock(plan, "2026-12-07")).toBe(false);
    expect(canPlaceBlock(plan, "2026-12-21")).toBe(false);
  });

  it("adds a block in date order", () => {
    expect(addBlock(plan, "2026-12-28").blockStarts).toEqual(["2026-12-21", "2026-12-28"]);
    expect(addBlock(plan, "2026-12-14").blockStarts).toEqual(["2026-12-14", "2026-12-21"]);
    expect(plan.blockStarts).toEqual(["2026-12-21"]);
  });

  it("won't add a block where one can't start", () => {
    expect(addBlock(plan, "2026-12-07")).toBe(plan);
    expect(addBlock(plan, "2026-12-21")).toBe(plan);
  });

  it("removes a block", () => {
    expect(removeBlock(plan, "2026-12-21").blockStarts).toEqual([]);
  });

  it("moves a block, keeping date order", () => {
    const two = addBlock(plan, "2026-12-28");
    expect(moveBlock(two, "2026-12-28", "2026-12-14").blockStarts).toEqual(["2026-12-14", "2026-12-21"]);
  });

  it("won't move a block onto the first week or another block, or move one that doesn't exist", () => {
    const two = addBlock(plan, "2026-12-28");
    expect(moveBlock(two, "2026-12-28", "2026-12-07")).toBe(two);
    expect(moveBlock(two, "2026-12-28", "2026-12-21")).toBe(two);
    expect(moveBlock(two, "2026-12-14", "2026-12-14")).toBe(two);
  });
});

describe("applySettings", () => {
  it("replaces name, dates, activities and blocks, and keeps prior weeks", () => {
    const settings = {
      name: "Renamed",
      startDate: "2026-12-14",
      weekCount: 2,
      activities: [run("only", "2026-12-15")],
      blockStarts: [],
    };
    expect(applySettings(plan, settings)).toEqual({ ...settings, priorWeeklyDistances: [20, 25] });
  });
});

describe("setPriorWeeks", () => {
  it("replaces prior weeks and keeps everything else", () => {
    expect(setPriorWeeks(plan, [30])).toEqual({ ...plan, priorWeeklyDistances: [30] });
  });
});
