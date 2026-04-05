import PlanView from "./components/PlanView";
import { seedPlan } from "@/lib/seed-data";

export default function Home() {
  return <PlanView plan={seedPlan} />;
}
