"use client";

import { useState } from "react";
import type { Activity, Plan } from "@/lib/types";
import {
  applyPlanSettings,
  isMonday,
  planEndDate,
  weeksBetween,
  type PlanSettingsFields,
} from "@/lib/plan-settings";

const MAX_LISTED = 5;

function formatDate(iso: string, withWeekday = false): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: withWeekday ? "short" : undefined,
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function describeActivity(a: Activity): string {
  const distance = a.type === "run" ? ` (${a.distance}km)` : "";
  return `${formatDate(a.date)} · ${a.name}${distance}`;
}

export default function PlanSettingsModal({
  current,
  onSave,
  onClose,
}: {
  current: PlanSettingsFields & Pick<Plan, "name">;
  onSave: (updated: PlanSettingsFields & Pick<Plan, "name">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(current.name);
  const [startDate, setStartDate] = useState(current.startDate);
  const [weeks, setWeeks] = useState(String(current.weekCount));
  const [moveActivities, setMoveActivities] = useState(true);

  const nameValid = name.trim() !== "";
  const weekCount = Number(weeks);
  const startValid = /^\d{4}-\d{2}-\d{2}$/.test(startDate) && isMonday(startDate);
  const weeksValid = Number.isInteger(weekCount) && weekCount >= 1;
  const preview =
    startValid && weeksValid
      ? applyPlanSettings(current, startDate, weekCount, moveActivities)
      : null;
  const removed = preview?.removed ?? [];

  function handleStartChange(next: string) {
    const bothValid = startValid && /^\d{4}-\d{2}-\d{2}$/.test(next) && isMonday(next);
    if (!moveActivities && bothValid && weeksValid) {
      setWeeks(String(weekCount - weeksBetween(startDate, next)));
    }
    setStartDate(next);
  }

  function handleMoveChange(next: boolean) {
    if (startValid && weeksValid) {
      const shift = weeksBetween(current.startDate, startDate);
      setWeeks(String(weekCount + (next ? shift : -shift)));
    }
    setMoveActivities(next);
  }

  function handleSave() {
    if (preview && nameValid) onSave({ ...preview.result, name: name.trim() });
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold mb-4">Plan settings</h2>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex gap-3 items-center">
            <label className="text-zinc-500 w-24">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 border border-zinc-300 rounded px-2 py-0.5 text-sm"
            />
          </div>
          {!nameValid && <p className="text-red-600">Name can&apos;t be empty.</p>}

          <div className="flex gap-3 items-center">
            <label className="text-zinc-500 w-24">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              className="border border-zinc-300 rounded px-2 py-0.5 text-sm"
            />
          </div>
          {!startValid && <p className="text-red-600">Start date must be a Monday.</p>}

          {startDate !== current.startDate && (
            <label className="flex gap-2 items-center ml-27">
              <input
                type="checkbox"
                checked={moveActivities}
                onChange={(e) => handleMoveChange(e.target.checked)}
              />
              <span className="text-zinc-700">Move activities and blocks with it</span>
            </label>
          )}

          <div className="flex gap-3 items-center">
            <label className="text-zinc-500 w-24">Weeks</label>
            <input
              type="number"
              min={1}
              step={1}
              value={weeks}
              onChange={(e) => setWeeks(e.target.value)}
              className="w-20 border border-zinc-300 rounded px-2 py-0.5 text-sm"
            />
            {startValid && weeksValid && (
              <span className="text-zinc-500">
                Ends {formatDate(planEndDate(startDate, weekCount), true)}
              </span>
            )}
          </div>
          {!weeksValid && <p className="text-red-600">Weeks must be a whole number of at least 1.</p>}
        </div>

        {removed.length > 0 && (
          <div className="mt-4 text-sm border border-red-200 bg-red-50 rounded p-3">
            <p className="text-red-700 font-medium mb-1">
              {removed.length === 1
                ? "1 activity falls outside the plan and will be deleted:"
                : `${removed.length} activities fall outside the plan and will be deleted:`}
            </p>
            <ul className="text-red-700">
              {removed.slice(0, MAX_LISTED).map((a) => (
                <li key={a.id}>{describeActivity(a)}</li>
              ))}
            </ul>
            {removed.length > MAX_LISTED && (
              <p className="text-red-700">and {removed.length - MAX_LISTED} more</p>
            )}
          </div>
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
            disabled={!preview || !nameValid}
            className={`px-4 py-1.5 text-sm text-white rounded disabled:opacity-40 disabled:cursor-not-allowed ${
              removed.length > 0 ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {removed.length === 0
              ? "Save"
              : `Save and delete ${removed.length} ${removed.length === 1 ? "activity" : "activities"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
