import { describe, expect, it } from "vitest";
import { computeWeekStats, computeWeekSummaries, groupActivitiesByWeek, groupActivitiesByDate } from "./calculations";
import type { Activity } from "./types";

function run(date: string, distance: number, intenseDistance = 0): Activity {
  return {
    id: `${date}-${distance}`,
    name: `${distance}km run`,
    date,
    distance,
    intenseDistance,
    type: "run",
  };
}

function gym(date: string): Activity {
  return {
    id: `${date}-gym`,
    name: "Gym",
    date,
    distance: 0,
    intenseDistance: 0,
    type: "gym",
  };
}

describe("computeWeekStats", () => {
  it("sums distance for runs in the given week", () => {
    const activities = [
      run("2025-03-03", 6), // Monday
      run("2025-03-05", 4), // Wednesday
      run("2025-03-08", 8), // Saturday
    ];
    const stats = computeWeekStats(activities, new Date("2025-03-03T00:00:00Z"));
    expect(stats.acuteDistance).toBe(18);
    expect(stats.longestRun).toBe(8);
  });

  it("excludes gym activities from volume", () => {
    const activities = [
      run("2025-03-03", 6),
      gym("2025-03-04"),
    ];
    const stats = computeWeekStats(activities, new Date("2025-03-03T00:00:00Z"));
    expect(stats.acuteDistance).toBe(6);
  });

  it("calculates intense and easy distance", () => {
    const activities = [
      run("2025-03-03", 8, 4), // 8km with 4km intense
      run("2025-03-05", 5, 0), // 5km easy
    ];
    const stats = computeWeekStats(activities, new Date("2025-03-03T00:00:00Z"));
    expect(stats.intenseDistance).toBe(4);
    expect(stats.easyDistance).toBe(9);
    expect(stats.percentEasy).toBeCloseTo(69.23, 1);
  });

  it("returns 100% easy when no runs exist", () => {
    const stats = computeWeekStats([], new Date("2025-03-03T00:00:00Z"));
    expect(stats.percentEasy).toBe(100);
    expect(stats.longestRun).toBe(0);
  });

  it("excludes activities outside the week", () => {
    const activities = [
      run("2025-03-02", 10), // Sunday before
      run("2025-03-03", 6),  // Monday (in week)
      run("2025-03-10", 10), // Monday after
    ];
    const stats = computeWeekStats(activities, new Date("2025-03-03T00:00:00Z"));
    expect(stats.acuteDistance).toBe(6);
  });
});

describe("computeWeekSummaries", () => {
  it("computes chronic distance as average of previous weeks", () => {
    // 4 weeks of data: 10, 12, 14, 16
    const activities = [
      run("2025-03-03", 10), // week 1
      run("2025-03-10", 12), // week 2
      run("2025-03-17", 14), // week 3
      run("2025-03-24", 16), // week 4
    ];
    const summaries = computeWeekSummaries(activities);
    expect(summaries).toHaveLength(4);

    // Week 4: chronic = avg of weeks 1-3 = (10+12+14)/3
    expect(summaries[3].chronicDistance).toBeCloseTo(12, 1);
  });

  it("computes ideal acute range from chronic distance", () => {
    const activities = [
      run("2025-03-03", 10),
      run("2025-03-10", 10),
      run("2025-03-17", 10),
      run("2025-03-24", 10),
    ];
    const summaries = computeWeekSummaries(activities);
    // Week 4: chronic = 10, range = [8, 13]
    expect(summaries[3].idealAcuteRange[0]).toBeCloseTo(8, 1);
    expect(summaries[3].idealAcuteRange[1]).toBeCloseTo(13, 1);
  });

  it("computes week-over-week change", () => {
    const activities = [
      run("2025-03-03", 10), // week 1
      run("2025-03-10", 12), // week 2: +20%
    ];
    const summaries = computeWeekSummaries(activities);
    expect(summaries[0].weekOverWeekChange).toBeNull();
    expect(summaries[1].weekOverWeekChange).toBeCloseTo(20, 1);
  });

  it("computes longest run vs previous week", () => {
    const activities = [
      run("2025-03-03", 5),
      run("2025-03-04", 8), // longest = 8
      run("2025-03-10", 6),
      run("2025-03-11", 10), // longest = 10
    ];
    const summaries = computeWeekSummaries(activities);
    expect(summaries[1].longestRunVsPrevWeek).toBe(2);
  });

  it("returns empty array for no activities", () => {
    expect(computeWeekSummaries([])).toEqual([]);
  });

  it("uses acute distance as chronic for the first week", () => {
    const activities = [run("2025-03-03", 15)];
    const summaries = computeWeekSummaries(activities);
    expect(summaries[0].chronicDistance).toBe(15);
  });
});

describe("groupActivitiesByWeek", () => {
  it("groups activities by their week start (Monday)", () => {
    const activities = [
      run("2025-03-03", 5), // Monday
      run("2025-03-06", 8), // Thursday same week
      run("2025-03-10", 6), // Monday next week
    ];
    const groups = groupActivitiesByWeek(activities);
    expect(groups.size).toBe(2);
    expect(groups.get("2025-03-03")).toHaveLength(2);
    expect(groups.get("2025-03-10")).toHaveLength(1);
  });

  it("handles Sunday as part of the preceding Monday's week", () => {
    const activities = [
      run("2025-03-09", 10), // Sunday belongs to week of March 3
    ];
    const groups = groupActivitiesByWeek(activities);
    expect(groups.get("2025-03-03")).toHaveLength(1);
  });
});

describe("groupActivitiesByDate", () => {
  it("groups activities by date", () => {
    const activities = [
      run("2025-03-03", 5),
      gym("2025-03-03"),
      run("2025-03-04", 6),
    ];
    const groups = groupActivitiesByDate(activities);
    expect(groups.get("2025-03-03")).toHaveLength(2);
    expect(groups.get("2025-03-04")).toHaveLength(1);
  });
});
