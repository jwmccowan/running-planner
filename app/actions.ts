"use server";

import type { Plan } from "@/lib/types";
import { savePlan } from "@/lib/plan-store";

export async function savePlanAction(plan: Plan): Promise<void> {
  await savePlan(plan);
}
