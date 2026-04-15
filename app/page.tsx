import PlanView from "./components/PlanView";
import { loadPlan } from "@/lib/plan-store";

export default async function Home() {
  const plan = await loadPlan("1");
  return <PlanView plan={plan} />;
}
