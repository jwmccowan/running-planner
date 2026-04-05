import type { Plan } from "@/lib/types";
import { computeWeekSummaries, groupActivitiesByWeek } from "@/lib/calculations";
import WeekRow from "./WeekRow";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PlanView({ plan }: { plan: Plan }) {
  const summaries = computeWeekSummaries(plan.activities, plan.priorWeeklyDistances);
  const byWeek = groupActivitiesByWeek(plan.activities);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">{plan.name}</h1>
      <div className="flex mb-2">
        <div className="min-w-56 pr-4 text-sm font-semibold text-zinc-700">
          Week summary
        </div>
        <div className="grid grid-cols-7 flex-1 gap-px">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-sm font-semibold text-zinc-700 px-2 pb-1"
            >
              {day}
            </div>
          ))}
        </div>
      </div>
      {summaries.map((summary, i) => {
        const weekActivities = byWeek.get(summary.startDate) ?? [];
        const isBlockBoundary = i > 0 && i % 4 === 0;
        return (
          <div key={summary.startDate}>
            {isBlockBoundary && <div className="h-6 bg-zinc-400 my-2" />}
            <WeekRow
              summary={summary}
              activities={weekActivities}
              dayOffset={i * 7}
            />
          </div>
        );
      })}
    </div>
  );
}
