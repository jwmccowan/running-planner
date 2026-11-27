import { limits } from "./limits";
import { addDays, isMonday } from "./plan-settings";
import type { Activity, Plan } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const RUN_TYPES = ["easy", "workout", "long", "race"];
const STATUSES = ["completed", "missed"];

function nameProblem(label: string, name: unknown): string | null {
  if (typeof name !== "string" || name.trim() === "") return `${label} can't be empty`;
  if (name.length > limits.maxNameLength) return `${label} must be at most ${limits.maxNameLength} characters`;
  return null;
}

function isDistance(value: unknown, max: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
}

export function planSettingsProblems(fields: Pick<Plan, "name" | "startDate" | "weekCount">): string[] {
  const problems: string[] = [];
  const name = nameProblem("Plan name", fields.name);
  if (name) problems.push(name);
  if (!ISO_DATE.test(fields.startDate) || !isMonday(fields.startDate)) {
    problems.push("Start date must be a Monday");
  }
  if (!Number.isInteger(fields.weekCount) || fields.weekCount < 1 || fields.weekCount > limits.maxWeeks) {
    problems.push(`Weeks must be a whole number from 1 to ${limits.maxWeeks}`);
  }
  return problems;
}

function activityProblem(a: Activity, startDate: string, endExclusive: string): string | null {
  const where = `Activity on ${a.date}`;
  if (typeof a.id !== "string" || a.id === "" || a.id.length > limits.maxNameLength) return `${where} has an invalid id`;
  const name = nameProblem(`${where}: name`, a.name);
  if (name) return name;
  if (!ISO_DATE.test(a.date) || a.date < startDate || a.date >= endExclusive) return `${where} is outside the plan`;
  if (!isDistance(a.distance, limits.maxActivityDistanceKm)) {
    return `${where}: distance must be 0–${limits.maxActivityDistanceKm} km`;
  }
  if (!isDistance(a.intenseDistance, a.distance)) return `${where}: intense distance must be 0–${a.distance} km`;
  if (a.type !== "run" && a.type !== "gym") return `${where} has an unknown type`;
  if (a.type === "run" && !RUN_TYPES.includes(a.runType)) return `${where} has an unknown run type`;
  if (a.status !== undefined && !STATUSES.includes(a.status)) return `${where} has an unknown status`;
  return null;
}

export function planProblems(plan: Plan): string[] {
  const problems = planSettingsProblems(plan);
  if (problems.length > 0) return problems;

  const endExclusive = addDays(plan.startDate, plan.weekCount * 7);

  if (plan.priorWeeklyDistances.length > limits.maxPriorWeeks) {
    problems.push(`At most ${limits.maxPriorWeeks} prior weeks`);
  }
  if (!plan.priorWeeklyDistances.every((d) => isDistance(d, limits.maxPriorWeekDistanceKm))) {
    problems.push(`Prior weekly distances must be 0–${limits.maxPriorWeekDistanceKm} km`);
  }
  if (!plan.blockStarts.every((d) => ISO_DATE.test(d) && isMonday(d) && d > plan.startDate && d < endExclusive)) {
    problems.push("Block bars must be on Mondays inside the plan, after its first week");
  }

  const perDay = new Map<string, number>();
  const ids = new Set<string>();
  for (const a of plan.activities) {
    const problem = activityProblem(a, plan.startDate, endExclusive);
    if (problem) problems.push(problem);
    if (ids.has(a.id)) problems.push(`Duplicate activity id ${a.id}`);
    ids.add(a.id);
    perDay.set(a.date, (perDay.get(a.date) ?? 0) + 1);
  }
  for (const [date, count] of perDay) {
    if (count > limits.maxActivitiesPerDay) {
      problems.push(`${date} has ${count} activities (max ${limits.maxActivitiesPerDay} per day)`);
    }
  }
  return problems;
}
