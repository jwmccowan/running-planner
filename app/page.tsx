import Link from "next/link";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { countOwnedPlans, listPlans, maxPlansPerUser } from "@/lib/plan-store";
import { requireUser } from "@/lib/session";
import NewPlanButton from "@/app/components/NewPlanButton";
import SignOutButton from "@/app/components/SignOutButton";
import PlanList from "@/app/components/PlanList";
import { summarizePlan } from "@/lib/plan-summary";

export default async function Home() {
  await connection();
  const user = await requireUser();
  const db = getDb();
  const plans = await listPlans(db, user.id);
  const atPlanLimit = (await countOwnedPlans(db, user.id)) >= maxPlansPerUser();
  const summaries = plans.map(summarizePlan);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto w-full">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
        <h1 className="text-xl font-bold">Running Planner</h1>
        <NewPlanButton
          disabledReason={
            atPlanLimit ? `You can have up to ${maxPlansPerUser()} plans for now.` : undefined
          }
        />
        <div className="w-full md:w-auto md:ml-auto flex items-center gap-3 text-sm text-zinc-500 min-w-0">
          <Link href="/help" className="shrink-0 hover:text-zinc-800">
            How it works
          </Link>
          <Link href="/account" title="Account" className="truncate hover:text-zinc-800">
            {user.email}
          </Link>
          <SignOutButton />
        </div>
      </div>

      {summaries.length === 0 && (
        <div className="border border-zinc-200 rounded p-4 text-sm text-zinc-700 leading-relaxed">
          <h2 className="text-base font-semibold text-zinc-900 mb-1">Plan your training, week by week</h2>
          <p className="mb-3">
            Lay out your runs and see how each week&apos;s load compares with what you&apos;ve been doing,
            so you can build up gradually.
          </p>
          <ol className="list-decimal pl-5 mb-4 flex flex-col gap-1">
            <li>Create a plan with a start date and length.</li>
            <li>Tap a day to add runs (easy, workout, long, race) or gym sessions.</li>
            <li>
              Add your last few weeks of running as <strong>prior weeks</strong>, so the first weeks have
              something to compare against.
            </li>
          </ol>
          <div className="flex flex-wrap items-center gap-3">
            <NewPlanButton label="Create your first plan" />
            <Link href="/help" className="text-blue-600 hover:text-blue-800">
              How it works
            </Link>
          </div>
        </div>
      )}

      <PlanList summaries={summaries} serverToday={new Date().toLocaleDateString("en-CA")} />
    </div>
  );
}
