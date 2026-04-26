import { config } from "./config";
import type { Activity, WeekStats, WeekSummary } from "./types";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = start of week
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function parseDate(iso: string): Date {
  return new Date(iso + "T00:00:00Z");
}

function runsOnly(activities: Activity[]): Activity[] {
  return activities.filter((a) => a.type === "run");
}

export function computeWeekStats(
  activities: Activity[],
  weekStart: Date
): WeekStats {
  const start = formatDate(weekStart);
  const end = formatDate(addDays(weekStart, 6));

  const runs = runsOnly(activities).filter(
    (a) => a.status !== "missed" && a.date >= start && a.date <= end
  );

  const acuteDistance = runs.reduce((sum, r) => sum + r.distance, 0);
  const intenseDistance = runs.reduce((sum, r) => sum + r.intenseDistance, 0);
  const easyDistance = acuteDistance - intenseDistance;
  const percentEasy = acuteDistance > 0 ? (easyDistance / acuteDistance) * 100 : 100;
  const longestRun = runs.length > 0 ? Math.max(...runs.map((r) => r.distance)) : 0;

  return {
    startDate: start,
    endDate: end,
    acuteDistance,
    intenseDistance,
    easyDistance,
    percentEasy,
    longestRun,
  };
}

export function computeWeekSummaries(
  activities: Activity[],
  priorWeeklyDistances: number[] = []
): WeekSummary[] {
  if (activities.length === 0) return [];

  const dates = activities.map((a) => parseDate(a.date));
  const earliest = startOfWeek(new Date(Math.min(...dates.map((d) => d.getTime()))));
  const latest = startOfWeek(new Date(Math.max(...dates.map((d) => d.getTime()))));

  const weeks: Date[] = [];
  let current = new Date(earliest);
  while (current <= latest) {
    weeks.push(new Date(current));
    current = addDays(current, 7);
  }

  const weekStats = weeks.map((w) => computeWeekStats(activities, w));

  // Prepend prior distances so early weeks have history for chronic calculation
  const allAcuteDistances = [
    ...priorWeeklyDistances,
    ...weekStats.map((w) => w.acuteDistance),
  ];
  const priorCount = priorWeeklyDistances.length;

  return weekStats.map((stats, i) => {
    const adjustedIndex = priorCount + i;
    const windowStart = Math.max(0, adjustedIndex - config.chronicWeeks);
    const prevDistances = allAcuteDistances.slice(windowStart, adjustedIndex);

    const chronicDistance =
      prevDistances.length > 0
        ? prevDistances.reduce((sum, d) => sum + d, 0) / prevDistances.length
        : stats.acuteDistance;

    const prev = i > 0 ? weekStats[i - 1] : null;

    const prevWeekStats = weekStats.slice(
      Math.max(0, i - config.chronicWeeks),
      i
    );
    const prevLongestRuns = prevWeekStats.map((w) => w.longestRun);
    const avgLongestRun =
      prevLongestRuns.length > 0
        ? prevLongestRuns.reduce((sum, v) => sum + v, 0) /
          prevLongestRuns.length
        : null;

    return {
      ...stats,
      chronicDistance,
      idealAcuteRange: [
        chronicDistance * config.acuteRangeLow,
        chronicDistance * config.acuteRangeHigh,
      ] as [number, number],
      acuteVsChronicChange:
        chronicDistance > 0
          ? ((stats.acuteDistance - chronicDistance) / chronicDistance) * 100
          : 0,
      weekOverWeekChange:
        prev && prev.acuteDistance > 0
          ? ((stats.acuteDistance - prev.acuteDistance) / prev.acuteDistance) *
            100
          : null,
      longestRunVsPrevWeek: prev ? stats.longestRun - prev.longestRun : null,
      longestRunVs4WeekAvg:
        avgLongestRun !== null ? stats.longestRun - avgLongestRun : null,
    };
  });
}

export function groupActivitiesByWeek(
  activities: Activity[]
): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>();
  for (const activity of activities) {
    const weekStart = formatDate(startOfWeek(parseDate(activity.date)));
    const existing = groups.get(weekStart);
    if (existing) {
      existing.push(activity);
    } else {
      groups.set(weekStart, [activity]);
    }
  }
  return groups;
}

export function groupActivitiesByDate(
  activities: Activity[]
): Map<string, Activity[]> {
  const groups = new Map<string, Activity[]>();
  for (const activity of activities) {
    const existing = groups.get(activity.date);
    if (existing) {
      existing.push(activity);
    } else {
      groups.set(activity.date, [activity]);
    }
  }
  return groups;
}
