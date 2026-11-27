"use server";

import { redirect } from "next/navigation";
import type { Plan } from "@/lib/types";
import { getDb } from "@/lib/db";
import { createPlan, PlanConflictError, savePlan } from "@/lib/plan-store";
import { planProblems, planSettingsProblems } from "@/lib/plan-validation";
import { requireUser } from "@/lib/session";

export type SavePlanResult = { ok: true; version: number } | { ok: false; reason: "conflict" };

export async function savePlanAction(plan: Plan): Promise<SavePlanResult> {
  const user = await requireUser();
  const problems = planProblems(plan);
  if (problems.length > 0) throw new Error(`Invalid plan: ${problems.join("; ")}`);
  try {
    return { ok: true, version: await savePlan(getDb(), plan, user.id) };
  } catch (error) {
    if (error instanceof PlanConflictError) return { ok: false, reason: "conflict" };
    throw error;
  }
}

export async function createPlanAction(
  fields: Pick<Plan, "name" | "startDate" | "weekCount">
): Promise<void> {
  const user = await requireUser();
  const name = fields.name.trim();
  const problems = planSettingsProblems({ ...fields, name });
  if (problems.length > 0) throw new Error(`Invalid plan: ${problems.join("; ")}`);
  const plan = await createPlan(getDb(), { ...fields, name }, user.id);
  redirect(`/plans/${plan.id}`);
}
