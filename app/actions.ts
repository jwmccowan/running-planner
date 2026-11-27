"use server";

import { redirect } from "next/navigation";
import type { Plan } from "@/lib/types";
import { getDb } from "@/lib/db";
import { createPlan, PlanConflictError, savePlan } from "@/lib/plan-store";
import { isMonday } from "@/lib/plan-settings";
import { requireUser } from "@/lib/session";

export type SavePlanResult = { ok: true; version: number } | { ok: false; reason: "conflict" };

export async function savePlanAction(plan: Plan): Promise<SavePlanResult> {
  const user = await requireUser();
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
  if (name === "") throw new Error("Plan name can't be empty");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.startDate) || !isMonday(fields.startDate)) {
    throw new Error("Start date must be a Monday");
  }
  if (!Number.isInteger(fields.weekCount) || fields.weekCount < 1) {
    throw new Error("Weeks must be a whole number of at least 1");
  }
  const plan = await createPlan(getDb(), { ...fields, name }, user.id);
  redirect(`/plans/${plan.id}`);
}
