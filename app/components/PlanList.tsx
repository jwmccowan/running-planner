"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { planStatus, sortPlanSummaries, type PlanStatus, type PlanSummary } from "@/lib/plan-summary";

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

const subscribeNever = () => () => {};
const browserToday = () => new Date().toLocaleDateString("en-CA");

// The server only knows its own (UTC) date, so it renders with that and the browser re-renders with the user's local date
export default function PlanList({ summaries, serverToday }: { summaries: PlanSummary[]; serverToday: string }) {
  const today = useSyncExternalStore(subscribeNever, browserToday, () => serverToday);

  return (
    <ul className="flex flex-col gap-2">
      {sortPlanSummaries(summaries, today).map((s) => {
        const status = planStatus(s, today);
        return (
          <li key={s.id}>
            <Link
              href={`/plans/${s.id}`}
              className="block border border-zinc-200 rounded p-3 hover:bg-zinc-50"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900">{s.name}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_STYLE[status]}`}>
                  {STATUS_LABEL[status]}
                </span>
              </div>
              <div className="text-sm text-zinc-500 mt-0.5">
                {formatRange(s.startDate, s.endDate)} · {s.weekCount}{" "}
                {s.weekCount === 1 ? "week" : "weeks"} · {formatKm(s.totalDistance)}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
