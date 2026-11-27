import { computeWeekSummaries } from "./calculations";
import { planEndDate } from "./plan-settings";
import type { Plan } from "./types";

export type PlanStatus = "current" | "upcoming" | "past";

export type PlanSummary = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  weekCount: number;
  totalDistance: number;
  status: PlanStatus;
};

export function summarizePlan(plan: Plan, today: string): PlanSummary {
  const endDate = planEndDate(plan.startDate, plan.weekCount);
  const weeks = computeWeekSummaries(plan.activities, plan.startDate, plan.weekCount);
  const status: PlanStatus =
    today < plan.startDate ? "upcoming" : today > endDate ? "past" : "current";
  return {
    id: plan.id,
    name: plan.name,
    startDate: plan.startDate,
    endDate,
    weekCount: plan.weekCount,
    totalDistance: weeks.reduce((sum, w) => sum + w.acuteDistance, 0),
    status,
  };
}

const STATUS_ORDER: Record<PlanStatus, number> = { current: 0, upcoming: 1, past: 2 };

// Current and upcoming plans soonest first, then past plans most recent first
export function sortPlanSummaries(summaries: PlanSummary[]): PlanSummary[] {
  return [...summaries].sort((a, b) => {
    if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (a.status === "past") return b.endDate.localeCompare(a.endDate);
    return a.startDate.localeCompare(b.startDate);
  });
}
