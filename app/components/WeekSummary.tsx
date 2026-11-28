import Link from "next/link";
import { config } from "@/lib/config";
import type { WeekSummary as WeekSummaryType } from "@/lib/types";

export function formatRange(start: string, end: string): string {
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

export function formatNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// Green inside the ideal range, red outside, neutral when there's no history to compare against
export function acuteColor(summary: WeekSummaryType): string {
  if (!summary.idealAcuteRange) return "text-zinc-700";
  const [low, high] = summary.idealAcuteRange;
  return summary.acuteDistance >= low && summary.acuteDistance <= high ? "text-green-700" : "text-red-600";
}

export function AddPriorWeeksPrompt({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title="Weekly distances before the plan starts, so early weeks have a chronic load"
      className="text-xs text-blue-600 hover:text-blue-800"
    >
      Add prior weeks
    </button>
  );
}

function CompactWeekSummary({
  summary,
  onAddPriorWeeks,
}: {
  summary: WeekSummaryType;
  onAddPriorWeeks?: () => void;
}) {
  return (
    <div className="text-sm py-1 pr-4">
      <span className="font-semibold text-zinc-900">
        {formatRange(summary.startDate, summary.endDate)}
      </span>
      <span className={`ml-2 ${acuteColor(summary)}`}>
        {formatNum(summary.acuteDistance)}km
      </span>
      {onAddPriorWeeks && (
        <div>
          <AddPriorWeeksPrompt onClick={onAddPriorWeeks} />
        </div>
      )}
    </div>
  );
}

// The stat lines of an expanded week (shared by the desktop summary column and the phone week card)
// Opens the matching section of the help page in a new tab, so unsaved plan edits aren't lost
function HelpLink({ section, label }: { section: string; label: string }) {
  return (
    <Link
      href={`/help#${section}`}
      target="_blank"
      rel="noopener"
      onClick={(e) => e.stopPropagation()}
      aria-label={`What is ${label}?`}
      title={`What is ${label}?`}
      className="inline-block ml-1 text-zinc-400 hover:text-zinc-700"
    >
      ⓘ
    </Link>
  );
}

export function WeekStats({
  summary,
  onAddPriorWeeks,
}: {
  summary: WeekSummaryType;
  onAddPriorWeeks?: () => void;
}) {
  const easyEnough = summary.percentEasy >= config.easyTargetPercent;

  const change = summary.acuteVsChronicChange;
  const chronicChangeStr = change === null ? "" : `(${change >= 0 ? "+" : ""}${Math.round(change)}%)`;
  const partialHistory =
    summary.chronicDistance !== null && summary.chronicWeeks < config.chronicWeeks
      ? ` (${summary.chronicWeeks} ${summary.chronicWeeks === 1 ? "wk" : "wks"})`
      : "";

  return (
    <>
      <div className="text-zinc-800">
        Chronic distance:{" "}
        {summary.chronicDistance === null ? "—" : formatNum(summary.chronicDistance)}
        {partialHistory && <span className="text-zinc-500">{partialHistory}</span>}
        <HelpLink section="chronic" label="chronic distance" />
      </div>
      {onAddPriorWeeks && <AddPriorWeeksPrompt onClick={onAddPriorWeeks} />}
      <div className="text-zinc-800">
        Ideal acute range:{" "}
        {summary.idealAcuteRange === null
          ? "—"
          : `(${formatNum(summary.idealAcuteRange[0])} – ${formatNum(summary.idealAcuteRange[1])})`}
        <HelpLink section="range" label="the ideal acute range" />
      </div>
      <div className={acuteColor(summary)}>
        Acute distance: {formatNum(summary.acuteDistance)} {chronicChangeStr}
        <HelpLink section="acute" label="acute distance" />
      </div>
      <div className={easyEnough ? "text-green-700" : "text-red-600"}>
        Percent easy: {Math.round(summary.percentEasy)}%
        <HelpLink section="easy" label="percent easy" />
      </div>
    </>
  );
}

function ExpandedWeekSummary({
  summary,
  onAddPriorWeeks,
}: {
  summary: WeekSummaryType;
  onAddPriorWeeks?: () => void;
}) {
  return (
    <div className="text-sm leading-relaxed py-2 pr-4">
      <div className="font-semibold text-zinc-900">
        {formatRange(summary.startDate, summary.endDate)}
      </div>
      <WeekStats summary={summary} onAddPriorWeeks={onAddPriorWeeks} />
    </div>
  );
}

export default function WeekSummary({
  summary,
  expanded,
  onAddPriorWeeks,
}: {
  summary: WeekSummaryType;
  expanded: boolean;
  onAddPriorWeeks?: () => void;
}) {
  if (expanded) {
    return <ExpandedWeekSummary summary={summary} onAddPriorWeeks={onAddPriorWeeks} />;
  }
  return <CompactWeekSummary summary={summary} onAddPriorWeeks={onAddPriorWeeks} />;
}
