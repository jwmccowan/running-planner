import { describe, expect, it } from "vitest";
import { seedPlan } from "./seed-data";
import { computeWeekSummaries } from "./calculations";

describe("seed data", () => {
  const summaries = computeWeekSummaries(seedPlan.activities, seedPlan.priorWeeklyDistances);

  // Expected weekly totals from the spreadsheet
  const expectedTotals = [
    { week: 1, start: "2026-02-09", total: 15 },
    { week: 2, start: "2026-02-16", total: 18 },
    { week: 3, start: "2026-02-23", total: 21 },
    { week: 4, start: "2026-03-02", total: 16 },
    { week: 5, start: "2026-03-09", total: 18 },
    { week: 6, start: "2026-03-16", total: 21 },
    { week: 7, start: "2026-03-23", total: 24 },
    { week: 8, start: "2026-03-30", total: 18 },
    { week: 9, start: "2026-04-06", total: 26 },
    { week: 10, start: "2026-04-13", total: 29 },
    { week: 11, start: "2026-04-20", total: 31 },
    { week: 12, start: "2026-04-27", total: 21 },
    { week: 13, start: "2026-05-04", total: 32 },
    { week: 14, start: "2026-05-11", total: 35 },
    { week: 15, start: "2026-05-18", total: 38 },
    { week: 16, start: "2026-05-25", total: 25 },
    { week: 17, start: "2026-06-01", total: 42 },
    { week: 18, start: "2026-06-08", total: 45 },
    { week: 19, start: "2026-06-15", total: 47 },
    { week: 20, start: "2026-06-22", total: 32 },
    { week: 21, start: "2026-06-29", total: 52 },
    { week: 22, start: "2026-07-06", total: 56 },
    { week: 23, start: "2026-07-13", total: 60 },
    { week: 24, start: "2026-07-20", total: 40 },
  ];

  it("has 24 weeks of data", () => {
    expect(summaries).toHaveLength(24);
  });

  for (const { week, start, total } of expectedTotals) {
    it(`week ${week} (${start}) totals ${total}km`, () => {
      const summary = summaries.find((s) => s.startDate === start);
      expect(summary).toBeDefined();
      expect(summary!.acuteDistance).toBe(total);
    });
  }

  it("parkruns have intenseDistance 5", () => {
    const parkruns = seedPlan.activities.filter((a) =>
      a.name.includes("parkrun")
    );
    expect(parkruns.length).toBeGreaterThan(0);
    for (const pr of parkruns) {
      expect(pr.intenseDistance).toBe(5);
    }
  });

  it("all activities have unique ids", () => {
    const ids = seedPlan.activities.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("plan starts on a Monday", () => {
    const day = new Date(seedPlan.startDate + "T00:00:00Z").getUTCDay();
    expect(day).toBe(1); // Monday
  });
});
