import type { Activity, ActivityStatus } from "@/lib/types";

function nextStatus(current: ActivityStatus | undefined): ActivityStatus | undefined {
  if (current === undefined) return "completed";
  if (current === "completed") return "missed";
  return undefined;
}

function chipColor(activity: Activity): string {
  if (activity.status === "missed") return "bg-zinc-200 text-zinc-400";
  const done = activity.status === "completed";
  if (activity.type === "gym") return done ? "bg-purple-200 text-purple-800" : "bg-purple-100 text-purple-800";
  switch (activity.runType) {
    case "easy":    return done ? "bg-blue-200 text-blue-800"   : "bg-blue-100 text-blue-800";
    case "workout": return done ? "bg-amber-200 text-amber-800" : "bg-amber-100 text-amber-800";
    case "long":    return done ? "bg-green-200 text-green-800" : "bg-green-100 text-green-800";
    case "race":    return done ? "bg-red-200 text-red-800"     : "bg-red-100 text-red-800";
  }
}

function statusIcon(status: ActivityStatus | undefined): string {
  if (status === "completed") return "✓";
  if (status === "missed") return "✗";
  return "○";
}

function ActivityChip({
  activity,
  onStatusChange,
  children,
}: {
  activity: Activity;
  onStatusChange: (id: string, status: ActivityStatus | undefined) => void;
  children: React.ReactNode;
}) {
  function handleStatusClick(e: React.MouseEvent) {
    e.stopPropagation();
    onStatusChange(activity.id, nextStatus(activity.status));
  }

  return (
    <div className={`flex rounded overflow-hidden text-xs ${chipColor(activity)}`}>
      <div className={`flex-1 px-1.5 py-0.5 min-w-0 ${activity.status === "missed" ? "line-through" : ""}`}>
        {children}
      </div>
      <button
        onClick={handleStatusClick}
        className="px-2 py-0.5 border-l border-black/10 bg-black/5 hover:bg-black/15 shrink-0 leading-none"
        title="Toggle status"
      >
        {statusIcon(activity.status)}
      </button>
    </div>
  );
}

function CompactDayCell({
  activities,
  onStatusChange,
}: {
  activities: Activity[];
  onStatusChange: (id: string, status: ActivityStatus | undefined) => void;
}) {
  if (activities.length === 0) return <div className="p-1 min-h-8" />;

  return (
    <div className="p-1 min-h-8 flex flex-col gap-0.5">
      {activities.map((a) => (
        <ActivityChip key={a.id} activity={a} onStatusChange={onStatusChange}>
          <span className="truncate block">
            {a.distance > 0 ? `${a.name} (${a.distance}km)` : a.name}
          </span>
        </ActivityChip>
      ))}
    </div>
  );
}

function ExpandedDayCell({
  dayNumber,
  activities,
  weekTotal,
  onStatusChange,
}: {
  dayNumber: number;
  activities: Activity[];
  weekTotal: number;
  onStatusChange: (id: string, status: ActivityStatus | undefined) => void;
}) {
  return (
    <div className="h-full border border-zinc-300 min-h-20 p-2 text-sm">
      <div className="text-zinc-500 text-xs mb-1">Day #{dayNumber}</div>
      <div className="flex flex-col gap-1">
        {activities.map((a) => {
          const pct =
            weekTotal > 0 ? Math.round((a.distance / weekTotal) * 100) : 0;
          return (
            <ActivityChip key={a.id} activity={a} onStatusChange={onStatusChange}>
              <div>{a.distance > 0 ? `${a.name} (${a.distance}km · ${pct}%)` : a.name}</div>
              {a.intenseDistance > 0 && (
                <div className="text-xs opacity-70">{a.intenseDistance}km intense</div>
              )}
            </ActivityChip>
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
  onStatusChange,
}: {
  date: string;
  dayNumber: number;
  activities: Activity[];
  weekTotal: number;
  expanded: boolean;
  onEdit: (date: string) => void;
  onStatusChange: (activityId: string, status: ActivityStatus | undefined) => void;
}) {
  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit(date);
  }

  if (expanded) {
    return (
      <div onClick={handleClick} className="h-full cursor-pointer hover:ring-1 hover:ring-blue-300 rounded">
        <ExpandedDayCell
          dayNumber={dayNumber}
          activities={activities}
          weekTotal={weekTotal}
          onStatusChange={onStatusChange}
        />
      </div>
    );
  }
  return (
    <div onClick={handleClick} className="cursor-pointer hover:bg-zinc-100 rounded">
      <CompactDayCell activities={activities} onStatusChange={onStatusChange} />
    </div>
  );
}
