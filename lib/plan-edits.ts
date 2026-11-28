import { limits } from "./limits";
import type { PlanSettingsFields } from "./plan-settings";
import type { Activity, ActivityStatus, Plan } from "./types";

// The parts of a plan the plan page edits (and undo/redo tracks)
export type PlanEdits = Pick<
  Plan,
  "name" | "startDate" | "weekCount" | "activities" | "priorWeeklyDistances" | "blockStarts"
>;

export function replaceDay(edits: PlanEdits, date: string, activities: Activity[]): PlanEdits {
  return { ...edits, activities: [...edits.activities.filter((a) => a.date !== date), ...activities] };
}

export function setActivityStatus(
  edits: PlanEdits,
  activityId: string,
  status: ActivityStatus | undefined
): PlanEdits {
  return {
    ...edits,
    activities: edits.activities.map((a) => (a.id === activityId ? { ...a, status } : a)),
  };
}

export function canMoveActivity(edits: PlanEdits, activityId: string, date: string): boolean {
  const activity = edits.activities.find((a) => a.id === activityId);
  if (!activity || activity.date === date) return false;
  return edits.activities.filter((a) => a.date === date).length < limits.maxActivitiesPerDay;
}

export function moveActivity(edits: PlanEdits, activityId: string, date: string): PlanEdits {
  const activity = edits.activities.find((a) => a.id === activityId);
  if (!activity || !canMoveActivity(edits, activityId, date)) return edits;
  return {
    ...edits,
    activities: [...edits.activities.filter((a) => a.id !== activityId), { ...activity, date }],
  };
}

// A block can start on any week except the first, and only one block starts per week
export function canPlaceBlock(edits: PlanEdits, weekStart: string): boolean {
  return weekStart > edits.startDate && !edits.blockStarts.includes(weekStart);
}

export function addBlock(edits: PlanEdits, weekStart: string): PlanEdits {
  if (!canPlaceBlock(edits, weekStart)) return edits;
  return { ...edits, blockStarts: [...edits.blockStarts, weekStart].sort() };
}

export function removeBlock(edits: PlanEdits, weekStart: string): PlanEdits {
  return { ...edits, blockStarts: edits.blockStarts.filter((d) => d !== weekStart) };
}

export function moveBlock(edits: PlanEdits, from: string, to: string): PlanEdits {
  if (!edits.blockStarts.includes(from) || !canPlaceBlock(edits, to)) return edits;
  return { ...edits, blockStarts: edits.blockStarts.map((d) => (d === from ? to : d)).sort() };
}

export function applySettings(edits: PlanEdits, settings: PlanSettingsFields & Pick<Plan, "name">): PlanEdits {
  return { ...edits, ...settings };
}

export function setPriorWeeks(edits: PlanEdits, priorWeeklyDistances: number[]): PlanEdits {
  return { ...edits, priorWeeklyDistances };
}
