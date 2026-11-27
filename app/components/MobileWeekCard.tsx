"use client";

import type { Activity, ActivityStatus, WeekSummary as WeekSummaryType } from "@/lib/types";
import { chipColor, nextStatus, statusIcon } from "./DayCell";
import { acuteColor, AddPriorWeeksPrompt, formatNum, formatRange, WeekStats } from "./WeekSummary";

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Phone layout for one week: activities as rows, plus a strip for opening any day
export default function MobileWeekCard({
  summary,
  activities,
  expanded,
  onToggle,
  onAddPriorWeeks,
  onDayEdit,
  onStatusChange,
}: {
  summary: WeekSummaryType;
  activities: Activity[];
  expanded: boolean;
  onToggle: () => void;
  onAddPriorWeeks?: () => void;
  onDayEdit: (date: string) => void;
  onStatusChange: (activityId: string, status: ActivityStatus | undefined) => void;
}) {
  const dates = DAY_NAMES.map((_, i) => addDays(summary.startDate, i));
  const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div data-mobile-week={summary.startDate} className="md:hidden border-b border-zinc-200 py-3">
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-baseline gap-2 text-left text-sm"
      >
        <span className="font-semibold text-zinc-900">{formatRange(summary.startDate, summary.endDate)}</span>
        <span className={`ml-auto ${acuteColor(summary)}`}>{formatNum(summary.acuteDistance)} km</span>
        <span className="text-zinc-400 w-3">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded ? (
        <div className="text-sm leading-relaxed mt-1">
          <WeekStats summary={summary} onAddPriorWeeks={onAddPriorWeeks} />
        </div>
      ) : (
        onAddPriorWeeks && <AddPriorWeeksPrompt onClick={onAddPriorWeeks} />
      )}

      {sorted.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {sorted.map((a) => (
            <li key={a.id} className={`flex items-stretch rounded text-sm ${chipColor(a)}`}>
              <button
                onClick={() => onDayEdit(a.date)}
                className={`flex-1 min-w-0 flex items-baseline gap-2 px-2 py-2 text-left ${
                  a.status === "missed" ? "line-through" : ""
                }`}
              >
                <span className="w-8 shrink-0 opacity-70">{DAY_NAMES[dates.indexOf(a.date)]}</span>
                <span className="flex-1 truncate">{a.name}</span>
                {a.distance > 0 && <span className="shrink-0">{formatNum(a.distance)} km</span>}
              </button>
              <button
                onClick={() => onStatusChange(a.id, nextStatus(a.status))}
                title="Toggle status"
                className="w-11 shrink-0 border-l border-black/10 bg-black/5 active:bg-black/15"
              >
                {statusIcon(a.status)}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex items-center gap-1">
        <span className="text-xs text-zinc-400 mr-1">Edit day</span>
        {dates.map((date, i) => {
          const hasActivities = activities.some((a) => a.date === date);
          return (
            <button
              key={date}
              data-mobile-date={date}
              onClick={() => onDayEdit(date)}
              aria-label={`Edit ${DAY_NAMES[i]} ${date}`}
              className="relative flex-1 h-9 rounded border border-zinc-200 text-xs text-zinc-600 active:bg-zinc-100"
            >
              {DAY_LETTERS[i]}
              {hasActivities && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-zinc-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
