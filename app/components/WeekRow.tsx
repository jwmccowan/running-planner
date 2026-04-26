import type { Activity, ActivityStatus } from "@/lib/types";
import type { WeekSummary as WeekSummaryType } from "@/lib/types";
import WeekSummary from "./WeekSummary";
import DayCell from "./DayCell";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function WeekRow({
  summary,
  activities,
  dayOffset,
  expanded,
  onToggle,
  onDayEdit,
  onStatusChange,
}: {
  summary: WeekSummaryType;
  activities: Activity[];
  dayOffset: number;
  expanded: boolean;
  onToggle: () => void;
  onDayEdit: (date: string) => void;
  onStatusChange: (activityId: string, status: ActivityStatus | undefined) => void;
}) {
  const actsByDate = new Map<string, Activity[]>();
  for (const a of activities) {
    const existing = actsByDate.get(a.date);
    if (existing) existing.push(a);
    else actsByDate.set(a.date, [a]);
  }

  return (
    <div className="flex">
      <div
        className="cursor-pointer hover:bg-zinc-50 rounded"
        onClick={onToggle}
      >
        <WeekSummary summary={summary} expanded={expanded} />
      </div>
      <div className="grid grid-cols-7 flex-1 gap-px">
        {DAYS.map((_, i) => {
          const date = addDays(summary.startDate, i);
          const dayActivities = actsByDate.get(date) ?? [];
          return (
            <DayCell
              key={date}
              date={date}
              dayNumber={dayOffset + i + 1}
              activities={dayActivities}
              weekTotal={summary.acuteDistance}
              expanded={expanded}
              onEdit={onDayEdit}
              onStatusChange={onStatusChange}
            />
          );
        })}
      </div>
    </div>
  );
}
