import { notFound } from "next/navigation";
import PlanView from "@/app/components/PlanView";
import { getDb } from "@/lib/db";
import { loadPlan } from "@/lib/plan-store";
import { requireUser } from "@/lib/session";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const plan = await loadPlan(getDb(), id, user.id);
  if (!plan) notFound();
  return <PlanView plan={plan} />;
}
