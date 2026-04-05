import type { WeekSummary as WeekSummaryType } from "@/lib/types";

function formatRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(s)} - ${fmt(e)}`;
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export default function WeekSummary({ summary }: { summary: WeekSummaryType }) {
  const inRange =
    summary.acuteDistance >= summary.idealAcuteRange[0] &&
    summary.acuteDistance <= summary.idealAcuteRange[1];

  const easyEnough = summary.percentEasy >= 80;

  const changeStr =
    summary.weekOverWeekChange !== null
      ? `(${summary.weekOverWeekChange >= 0 ? "+" : ""}${Math.round(summary.weekOverWeekChange)}%)`
      : "";

  return (
    <div className="text-sm leading-relaxed py-2 pr-4 min-w-56">
      <div className="font-semibold text-zinc-900">
        {formatRange(summary.startDate, summary.endDate)}
      </div>
      <div className="text-zinc-600">
        Chronic distance: {formatNum(summary.chronicDistance)}
      </div>
      <div className="text-zinc-600">
        Ideal acute range: ({formatNum(summary.idealAcuteRange[0])} –{" "}
        {formatNum(summary.idealAcuteRange[1])})
      </div>
      <div className={inRange ? "text-green-700" : "text-red-600"}>
        Acute distance: {formatNum(summary.acuteDistance)} {changeStr}
      </div>
      <div className={easyEnough ? "text-green-700" : "text-red-600"}>
        Percent easy: {Math.round(summary.percentEasy)}%
      </div>
    </div>
  );
}
