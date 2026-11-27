"use server";

import { redirect } from "next/navigation";
import type { Plan } from "@/lib/types";
import { createPlan, savePlan } from "@/lib/plan-store";
import { isMonday } from "@/lib/plan-settings";

export async function savePlanAction(plan: Plan): Promise<void> {
  await savePlan(plan);
}

export async function createPlanAction(
  fields: Pick<Plan, "name" | "startDate" | "weekCount">
): Promise<void> {
  const name = fields.name.trim();
  if (name === "") throw new Error("Plan name can't be empty");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.startDate) || !isMonday(fields.startDate)) {
    throw new Error("Start date must be a Monday");
  }
  if (!Number.isInteger(fields.weekCount) || fields.weekCount < 1) {
    throw new Error("Weeks must be a whole number of at least 1");
  }
  const plan = await createPlan({ ...fields, name });
  redirect(`/plans/${plan.id}`);
}
