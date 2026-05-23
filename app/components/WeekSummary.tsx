import type { WeekSummary as WeekSummaryType } from "@/lib/types";

function formatRange(start: string, end: string): string {
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  return `${fmt(s)} – ${fmt(e)}`;
}

function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function CompactWeekSummary({ summary }: { summary: WeekSummaryType }) {
  const inRange =
    summary.acuteDistance >= summary.idealAcuteRange[0] &&
    summary.acuteDistance <= summary.idealAcuteRange[1];

  return (
    <div className="text-sm py-1 pr-4">
      <span className="font-semibold text-zinc-900">
        {formatRange(summary.startDate, summary.endDate)}
      </span>
      <span className={`ml-2 ${inRange ? "text-green-700" : "text-red-600"}`}>
        {formatNum(summary.acuteDistance)}km
      </span>
    </div>
  );
}

function ExpandedWeekSummary({ summary }: { summary: WeekSummaryType }) {
  const inRange =
    summary.acuteDistance >= summary.idealAcuteRange[0] &&
    summary.acuteDistance <= summary.idealAcuteRange[1];

  const easyEnough = summary.percentEasy >= 80;

  const chronicChangeStr = `(${summary.acuteVsChronicChange >= 0 ? "+" : ""}${Math.round(summary.acuteVsChronicChange)}%)`;

  return (
    <div className="text-sm leading-relaxed py-2 pr-4">
      <div className="font-semibold text-zinc-900">
        {formatRange(summary.startDate, summary.endDate)}
      </div>
      <div className="text-zinc-800">
        Chronic distance: {formatNum(summary.chronicDistance)}
      </div>
      <div className="text-zinc-800">
        Ideal acute range: ({formatNum(summary.idealAcuteRange[0])} –{" "}
        {formatNum(summary.idealAcuteRange[1])})
      </div>
      <div className={inRange ? "text-green-700" : "text-red-600"}>
        Acute distance: {formatNum(summary.acuteDistance)} {chronicChangeStr}
      </div>
      <div className={easyEnough ? "text-green-700" : "text-red-600"}>
        Percent easy: {Math.round(summary.percentEasy)}%
      </div>
    </div>
  );
}

export default function WeekSummary({
  summary,
  expanded,
}: {
  summary: WeekSummaryType;
  expanded: boolean;
}) {
  if (expanded) {
    return <ExpandedWeekSummary summary={summary} />;
  }
  return <CompactWeekSummary summary={summary} />;
}
