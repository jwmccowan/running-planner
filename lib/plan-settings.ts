import type { Activity, Plan } from "./types";

export type PlanSettingsFields = Pick<Plan, "startDate" | "weekCount" | "activities" | "blockStarts">;

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(iso: string): Date {
  return new Date(iso + "T00:00:00Z");
}

export function addDays(iso: string, days: number): string {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weeksBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / (7 * DAY_MS));
}

export function isMonday(iso: string): boolean {
  return parseDate(iso).getUTCDay() === 1;
}

export function planEndDate(startDate: string, weekCount: number): string {
  return addDays(startDate, weekCount * 7 - 1);
}

export function applyPlanSettings(
  current: PlanSettingsFields,
  startDate: string,
  weekCount: number,
  moveActivities: boolean
): { result: PlanSettingsFields; removed: Activity[] } {
  const shiftDays = moveActivities ? weeksBetween(current.startDate, startDate) * 7 : 0;
  const end = addDays(startDate, weekCount * 7);
  const inPlan = (date: string) => date >= startDate && date < end;

  const shifted = current.activities.map((a) =>
    shiftDays === 0 ? a : { ...a, date: addDays(a.date, shiftDays) }
  );
  const blockStarts = current.blockStarts
    .map((d) => addDays(d, shiftDays))
    .filter((d) => d > startDate && d < end);

  return {
    result: {
      startDate,
      weekCount,
      activities: shifted.filter((a) => inPlan(a.date)),
      blockStarts,
    },
    removed: current.activities.filter((_, i) => !inPlan(shifted[i].date)),
  };
}
