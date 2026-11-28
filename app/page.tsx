import Link from "next/link";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { countOwnedPlans, listPlans, maxPlansPerUser } from "@/lib/plan-store";
import { requireUser } from "@/lib/session";
import NewPlanButton from "@/app/components/NewPlanButton";
import SignOutButton from "@/app/components/SignOutButton";
import { sortPlanSummaries, summarizePlan, type PlanStatus } from "@/lib/plan-summary";

const STATUS_LABEL: Record<PlanStatus, string> = {
  current: "Now",
  upcoming: "Upcoming",
  past: "Past",
};

const STATUS_STYLE: Record<PlanStatus, string> = {
  current: "bg-green-100 text-green-800",
  upcoming: "bg-blue-100 text-blue-800",
  past: "bg-zinc-100 text-zinc-600",
};

function formatRange(start: string, end: string): string {
  const fmt = (iso: string, withYear: boolean) =>
    new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: withYear ? "numeric" : undefined,
      timeZone: "UTC",
    });
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${fmt(start, !sameYear)} – ${fmt(end, true)}`;
}

function formatKm(km: number): string {
  return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
}

export default async function Home() {
  await connection();
  const user = await requireUser();
  const db = getDb();
  const plans = await listPlans(db, user.id);
  const atPlanLimit = (await countOwnedPlans(db, user.id)) >= maxPlansPerUser();
  const today = new Date().toLocaleDateString("en-CA");
  const summaries = sortPlanSummaries(plans.map((p) => summarizePlan(p, today)));

  return (
    <div className="p-4 md:p-6 max-w-2xl">
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

      <ul className="flex flex-col gap-2">
        {summaries.map((s) => (
          <li key={s.id}>
            <Link
              href={`/plans/${s.id}`}
              className="block border border-zinc-200 rounded p-3 hover:bg-zinc-50"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900">{s.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_STYLE[s.status]}`}>
                  {STATUS_LABEL[s.status]}
                </span>
              </div>
              <div className="text-sm text-zinc-500 mt-0.5">
                {formatRange(s.startDate, s.endDate)} · {s.weekCount}{" "}
                {s.weekCount === 1 ? "week" : "weeks"} · {formatKm(s.totalDistance)}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
