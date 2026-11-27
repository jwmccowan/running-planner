import { notFound } from "next/navigation";
import PlanView from "@/app/components/PlanView";
import { loadPlan } from "@/lib/plan-store";
import type { Plan } from "@/lib/types";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let plan: Plan | null;
  try {
    plan = await loadPlan(id);
  } catch (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Couldn&apos;t load plan {id}</h1>
        <pre className="text-sm text-red-700 whitespace-pre-wrap">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    );
  }
  if (!plan) notFound();
  return <PlanView plan={plan} />;
}
