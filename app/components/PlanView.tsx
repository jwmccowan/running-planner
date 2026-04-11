"use client";

import { useState } from "react";
import type { Activity, Plan } from "@/lib/types";
import { computeWeekSummaries, groupActivitiesByWeek } from "@/lib/calculations";
import WeekRow from "./WeekRow";
import DayEditorModal from "./DayEditorModal";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PlanView({ plan }: { plan: Plan }) {
  const [activities, setActivities] = useState<Activity[]>(plan.activities);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

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

  function handleSave(date: string, updated: Activity[]) {
    setActivities((prev) => [
      ...prev.filter((a) => a.date !== date),
      ...updated,
    ]);
    setEditingDate(null);
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">{plan.name}</h1>
      <div className="flex mb-1">
        <div className="min-w-48 pr-4" />
        <div className="grid grid-cols-7 flex-1 gap-px">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-xs font-semibold text-zinc-500 px-1 pb-1"
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
            {isBlockBoundary && <div className="h-4 bg-zinc-200 my-1" />}
            <WeekRow
              summary={summary}
              activities={weekActivities}
              dayOffset={i * 7}
              expanded={expandedWeeks.has(summary.startDate)}
              onToggle={() => toggleWeek(summary.startDate)}
              onDayEdit={setEditingDate}
            />
          </div>
        );
      })}

      {editingDate && (
        <DayEditorModal
          date={editingDate}
          activities={activities.filter((a) => a.date === editingDate)}
          onSave={(updated) => handleSave(editingDate, updated)}
          onClose={() => setEditingDate(null)}
        />
      )}
    </div>
  );
}
