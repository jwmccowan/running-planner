import Link from "next/link";
import { connection } from "next/server";
import { listPlans } from "@/lib/plan-store";
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
  const entries = await listPlans();
  const today = new Date().toLocaleDateString("en-CA");

  const summaries = sortPlanSummaries(
    entries.flatMap((e) => ("plan" in e ? [summarizePlan(e.plan, today)] : []))
  );
  const broken = entries.flatMap((e) => ("error" in e ? [e] : []));

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold mb-4">Running Planner</h1>

      {summaries.length === 0 && broken.length === 0 && (
        <p className="text-sm text-zinc-500">No plans yet.</p>
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
        {broken.map((b) => (
          <li key={b.id}>
            <Link
              href={`/plans/${b.id}`}
              className="block border border-red-200 bg-red-50 rounded p-3 hover:bg-red-100"
            >
              <div className="font-semibold text-red-800">Plan {b.id} couldn&apos;t be loaded</div>
              <div className="text-sm text-red-700 mt-0.5 break-words">{b.error}</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
