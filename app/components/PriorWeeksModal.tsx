"use client";

import { useState } from "react";
import { config } from "@/lib/config";
import { limits } from "@/lib/limits";

function weekLabel(planStartDate: string, weeksBefore: number): string {
  const d = new Date(planStartDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - weeksBefore * 7);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function toDrafts(distances: number[]): string[] {
  const recent = distances.slice(-config.chronicWeeks);
  const blanks = Array(config.chronicWeeks - recent.length).fill("");
  return [...blanks, ...recent.map(String)];
}

export default function PriorWeeksModal({
  planStartDate,
  priorWeeklyDistances,
  onSave,
  onClose,
}: {
  planStartDate: string;
  priorWeeklyDistances: number[];
  onSave: (priorWeeklyDistances: number[]) => void;
  onClose: () => void;
}) {
  const [drafts, setDrafts] = useState<string[]>(() =>
    toDrafts(priorWeeklyDistances)
  );

  const firstFilled = drafts.findIndex((d) => d.trim() !== "");
  const filled = firstFilled === -1 ? [] : drafts.slice(firstFilled);
  const hasGap = filled.some((d) => d.trim() === "");
  const outOfRange = filled.some((d) => {
    const km = parseFloat(d) || 0;
    return km < 0 || km > limits.maxPriorWeekDistanceKm;
  });

  function updateDraft(index: number, value: string) {
    setDrafts((prev) => prev.map((d, i) => (i === index ? value : d)));
  }

  function handleSave() {
    onSave(filled.map((d) => parseFloat(d) || 0));
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md max-h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-1">Prior weeks</h2>
        <p className="text-sm text-zinc-500 mb-4">
          Weekly distance before the plan starts, used for early chronic load.
        </p>

        <div className="flex flex-col gap-2">
          {drafts.map((draft, i) => (
            <div key={i} className="flex gap-3 items-center text-sm">
              <label className="text-zinc-500 w-36">
                Week of {weekLabel(planStartDate, config.chronicWeeks - i)}
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={draft}
                onChange={(e) => updateDraft(i, e.target.value)}
                className="w-20 border border-zinc-300 rounded px-2 py-0.5 text-sm"
              />
              <span className="text-zinc-400">km</span>
            </div>
          ))}
        </div>

        {hasGap && (
          <p className="text-sm text-red-600 mt-3">
            Only the oldest weeks can be left blank.
          </p>
        )}
        {outOfRange && (
          <p className="text-sm text-red-600 mt-3">
            Weekly distances must be 0–{limits.maxPriorWeekDistanceKm} km.
          </p>
        )}

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={hasGap || outOfRange}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
