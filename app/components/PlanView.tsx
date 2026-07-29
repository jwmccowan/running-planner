"use client";

import { useState, useActionState, startTransition } from "react";
import type { Activity, ActivityStatus, Plan } from "@/lib/types";
import { computeWeekSummaries, groupActivitiesByWeek } from "@/lib/calculations";
import { useUndoHistory } from "@/lib/use-undo-history";
import { savePlanAction } from "@/app/actions";
import WeekRow from "./WeekRow";
import DayEditorModal from "./DayEditorModal";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PlanView({ plan }: { plan: Plan }) {
  const {
    value: activities,
    set: setActivities,
    undo,
    redo,
    canUndo,
    canRedo,
    isSaved: saved,
    markSaved,
  } = useUndoHistory<Activity[]>(plan.activities);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [, dispatch, saving] = useActionState(
    async (_: null, toSave: Activity[]) => {
      await savePlanAction({ ...plan, activities: toSave });
      markSaved();
      return null;
    },
    null
  );

  const summaries = computeWeekSummaries(activities, plan.priorWeeklyDistances);
  const byWeek = groupActivitiesByWeek(activities);

  function toggleWeek(startDate: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(startDate)) {
        next.delete(startDate);
      } else {
        next.add(startDate);
      }
      return next;
    });
  }

  function handleDayEdit(date: string, updated: Activity[]) {
    setActivities((prev) => [
      ...prev.filter((a) => a.date !== date),
      ...updated,
    ]);
    setEditingDate(null);
  }

  function handleStatusChange(activityId: string, status: ActivityStatus | undefined) {
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, status } : a))
    );
  }


  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-xl font-bold">{plan.name}</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Cmd+Z)"
            className="px-2 py-1 text-sm rounded border border-zinc-300 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Cmd+Shift+Z)"
            className="px-2 py-1 text-sm rounded border border-zinc-300 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Redo
          </button>
        </div>
        <button
          onClick={() => startTransition(() => dispatch(activities))}
          disabled={saved || saving}
          className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
      </div>
      <div className="grid gap-px mb-1" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) repeat(7, minmax(0, 1fr))' }}>
        <div />
        {DAYS.map((day) => (
          <div
            key={day}
            className="text-xs font-semibold text-zinc-500 px-1 pb-1"
          >
            {day}
          </div>
        ))}
      </div>
      {summaries.map((summary, i) => {
        const weekActivities = byWeek.get(summary.startDate) ?? [];
        const isBlockBoundary = i > 0 && i % 4 === 0;
        return (
          <div key={summary.startDate}>
            {isBlockBoundary && <div className="h-4 bg-zinc-200 my-1" />}
            <WeekRow
              summary={summary}
              activities={weekActivities}
              dayOffset={i * 7}
              expanded={expandedWeeks.has(summary.startDate)}
              onToggle={() => toggleWeek(summary.startDate)}
              onDayEdit={setEditingDate}
              onStatusChange={handleStatusChange}
            />
          </div>
        );
      })}

      {editingDate && (
        <DayEditorModal
          date={editingDate}
          activities={activities.filter((a) => a.date === editingDate)}
          onSave={(updated) => handleDayEdit(editingDate, updated)}
          onClose={() => setEditingDate(null)}
        />
      )}
    </div>
  );
}
