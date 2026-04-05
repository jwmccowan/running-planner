import type { Activity } from "@/lib/types";

export default function DayCell({
  dayNumber,
  activities,
  weekTotal,
}: {
  dayNumber: number;
  activities: Activity[];
  weekTotal: number;
}) {
  const runs = activities.filter((a) => a.type === "run");

  return (
    <div className="border border-zinc-200 min-h-20 p-2 text-sm">
      <div className="text-zinc-400 text-xs mb-1">Day #{dayNumber}</div>
      {activities.map((a) => {
        if (a.type === "gym") {
          return (
            <div key={a.id} className="text-zinc-500">
              Gym
            </div>
          );
        }
        const pct =
          weekTotal > 0 ? Math.round((a.distance / weekTotal) * 100) : 0;
        return (
          <div key={a.id} className="text-zinc-800">
            {a.name} ({pct}%)
          </div>
        );
      })}
    </div>
  );
}
