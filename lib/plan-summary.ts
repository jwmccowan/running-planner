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
};

export function summarizePlan(plan: Plan): PlanSummary {
  const weeks = computeWeekSummaries(plan.activities, plan.startDate, plan.weekCount);
  return {
    id: plan.id,
    name: plan.name,
    startDate: plan.startDate,
    endDate: planEndDate(plan.startDate, plan.weekCount),
    weekCount: plan.weekCount,
    totalDistance: weeks.reduce((sum, w) => sum + w.acuteDistance, 0),
  };
}

export function planStatus(summary: PlanSummary, today: string): PlanStatus {
  if (today < summary.startDate) return "upcoming";
  if (today > summary.endDate) return "past";
  return "current";
}

const STATUS_ORDER: Record<PlanStatus, number> = { current: 0, upcoming: 1, past: 2 };

// Current and upcoming plans soonest first, then past plans most recent first
export function sortPlanSummaries(summaries: PlanSummary[], today: string): PlanSummary[] {
  return [...summaries].sort((a, b) => {
    const statusA = planStatus(a, today);
    const statusB = planStatus(b, today);
    if (statusA !== statusB) return STATUS_ORDER[statusA] - STATUS_ORDER[statusB];
    if (statusA === "past") return b.endDate.localeCompare(a.endDate);
    return a.startDate.localeCompare(b.startDate);
  });
}
