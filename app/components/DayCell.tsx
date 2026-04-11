import type { Activity } from "@/lib/types";

function activityColor(activity: Activity): string {
  if (activity.type === "gym") return "bg-purple-100 text-purple-800";
  if (activity.name.includes("parkrun")) return "bg-green-100 text-green-800";
  if (activity.name.includes("long run")) return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800"; // easy run / default
}

function CompactDayCell({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) return <div className="p-1 min-h-8" />;

  return (
    <div className="p-1 min-h-8 flex flex-col gap-0.5">
      {activities.map((a) => (
        <div
          key={a.id}
          className={`text-xs truncate rounded px-1 ${activityColor(a)}`}
        >
          {a.name}
        </div>
      ))}
    </div>
  );
}

function ExpandedDayCell({
  dayNumber,
  activities,
  weekTotal,
}: {
  dayNumber: number;
  activities: Activity[];
  weekTotal: number;
}) {
  return (
    <div className="border border-zinc-300 min-h-20 p-2 text-sm">
      <div className="text-zinc-500 text-xs mb-1">Day #{dayNumber}</div>
      <div className="flex flex-col gap-1">
        {activities.map((a) => {
          const color = activityColor(a);
          if (a.type === "gym") {
            return (
              <div key={a.id} className={`rounded px-1.5 py-0.5 ${color}`}>
                Gym
              </div>
            );
          }
          const pct =
            weekTotal > 0 ? Math.round((a.distance / weekTotal) * 100) : 0;
          return (
            <div key={a.id} className={`rounded px-1.5 py-0.5 ${color}`}>
              <div>{a.name} ({pct}%)</div>
              {a.intenseDistance > 0 && (
                <div className="text-xs opacity-70">
                  {a.intenseDistance}km intense
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DayCell({
  date,
  dayNumber,
  activities,
  weekTotal,
  expanded,
  onEdit,
}: {
  date: string;
  dayNumber: number;
  activities: Activity[];
  weekTotal: number;
  expanded: boolean;
  onEdit: (date: string) => void;
}) {
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit(date);
  }

  if (expanded) {
    return (
      <div onClick={handleClick} className="cursor-pointer hover:ring-1 hover:ring-blue-300 rounded">
        <ExpandedDayCell
          dayNumber={dayNumber}
          activities={activities}
          weekTotal={weekTotal}
        />
      </div>
    );
  }
  return (
    <div onClick={handleClick} className="cursor-pointer hover:bg-zinc-100 rounded">
      <CompactDayCell activities={activities} />
    </div>
  );
}
