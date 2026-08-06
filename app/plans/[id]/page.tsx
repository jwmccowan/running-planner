import { notFound } from "next/navigation";
import PlanView from "@/app/components/PlanView";
import { loadPlan } from "@/lib/plan-store";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const plan = await loadPlan(id);
    return <PlanView plan={plan} />;
  } catch {
    notFound();
  }
}
