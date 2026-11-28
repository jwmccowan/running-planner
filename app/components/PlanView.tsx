"use client";

import { useEffect, useState, useActionState, startTransition, useTransition } from "react";
import Link from "next/link";
import type { Activity, ActivityStatus, Plan } from "@/lib/types";
import { computeWeekSummaries, groupActivitiesByWeek } from "@/lib/calculations";
import { useUndoHistory } from "@/lib/use-undo-history";
import { limits } from "@/lib/limits";
import { deletePlanAction, savePlanAction } from "@/app/actions";
import WeekRow from "./WeekRow";
import MobileWeekCard from "./MobileWeekCard";
import DayEditorModal from "./DayEditorModal";
import PriorWeeksModal from "./PriorWeeksModal";
import PlanSettingsModal from "./PlanSettingsModal";
import { AddBlockGap, BlockBar, BLOCK_MIME } from "./BlockBar";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type SaveState = { version: number; conflict: boolean; failed: boolean };

type PlanEdits = Pick<
  Plan,
  "name" | "startDate" | "weekCount" | "activities" | "priorWeeklyDistances" | "blockStarts"
>;

export default function PlanView({ plan }: { plan: Plan }) {
  const {
    value: edits,
    set: setEdits,
    undo,
    redo,
    canUndo,
    canRedo,
    isSaved: saved,
    markSaved,
  } = useUndoHistory<PlanEdits>({
    name: plan.name,
    startDate: plan.startDate,
    weekCount: plan.weekCount,
    activities: plan.activities,
    priorWeeklyDistances: plan.priorWeeklyDistances ?? [],
    blockStarts: plan.blockStarts ?? [],
  });
  const { name, startDate, weekCount, activities, priorWeeklyDistances, blockStarts } = edits;
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingPriorWeeks, setEditingPriorWeeks] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, startDeleting] = useTransition();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  const [editingBlocks, setEditingBlocks] = useState(false);
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [blockDropTarget, setBlockDropTarget] = useState<string | null>(null);
  const [saveState, dispatch, saving] = useActionState(
    async (prev: SaveState, toSave: PlanEdits): Promise<SaveState> => {
      try {
        const result = await savePlanAction({ ...plan, ...toSave, version: prev.version });
        if (!result.ok) return { ...prev, conflict: true, failed: false };
        markSaved(toSave);
        return { version: result.version, conflict: false, failed: false };
      } catch {
        return { ...prev, failed: true };
      }
    },
    { version: plan.version, conflict: false, failed: false }
  );
  // After a conflict the edits can't be saved, and the banner already says Reload loses them
  const hasUnsavedEdits = !saved && !saveState.conflict;

  useEffect(() => {
    if (!hasUnsavedEdits) return;
    function warnBeforeLeaving(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [hasUnsavedEdits]);

  const summaries = computeWeekSummaries(activities, startDate, weekCount, priorWeeklyDistances);
  const byWeek = groupActivitiesByWeek(activities);

  function save() {
    startTransition(() => dispatch(edits));
  }

  function setActivities(update: (prev: Activity[]) => Activity[]) {
    setEdits((prev) => ({ ...prev, activities: update(prev.activities) }));
  }

  function setBlockStarts(update: (prev: string[]) => string[]) {
    setEdits((prev) => ({ ...prev, blockStarts: update(prev.blockStarts) }));
  }

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

  function handlePriorWeeksEdit(updated: number[]) {
    setEdits((prev) => ({ ...prev, priorWeeklyDistances: updated }));
    setEditingPriorWeeks(false);
  }

  function handleSettingsEdit(
    updated: Pick<PlanEdits, "name" | "startDate" | "weekCount" | "activities" | "blockStarts">
  ) {
    setEdits((prev) => ({ ...prev, ...updated }));
    setEditingSettings(false);
  }

  function handleStatusChange(activityId: string, status: ActivityStatus | undefined) {
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, status } : a))
    );
  }

  function handleActivityMove(activityId: string, date: string) {
    const activity = activities.find((a) => a.id === activityId);
    if (!activity || activity.date === date) return;
    if (activities.filter((a) => a.date === date).length >= limits.maxActivitiesPerDay) return;
    setActivities((prev) => [
      ...prev.filter((a) => a.id !== activityId),
      { ...activity, date },
    ]);
  }

  function handleBlockAdd(weekStart: string) {
    setBlockStarts((prev) => [...prev, weekStart].sort());
  }

  function handleBlockRemove(weekStart: string) {
    setBlockStarts((prev) => prev.filter((d) => d !== weekStart));
  }

  function canDropBlock(weekStart: string, weekIndex: number): boolean {
    return draggingBlock !== null && weekIndex > 0 && !blockStarts.includes(weekStart);
  }

  function handleBlockDragOver(e: React.DragEvent, weekStart: string, weekIndex: number) {
    if (!e.dataTransfer.types.includes(BLOCK_MIME) || !canDropBlock(weekStart, weekIndex)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setBlockDropTarget(weekStart);
  }

  function handleBlockDragLeave(e: React.DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setBlockDropTarget(null);
  }

  function handleBlockDrop(e: React.DragEvent, weekStart: string, weekIndex: number) {
    if (!draggingBlock || !canDropBlock(weekStart, weekIndex)) return;
    e.preventDefault();
    const from = draggingBlock;
    setBlockStarts((prev) => prev.map((d) => (d === from ? weekStart : d)).sort());
    setDraggingBlock(null);
    setBlockDropTarget(null);
  }

  function handleBlockDragEnd() {
    setDraggingBlock(null);
    setBlockDropTarget(null);
  }


  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <Link
          href="/"
          onClick={(e) => {
            if (hasUnsavedEdits && !window.confirm("You have unsaved changes. Leave without saving?")) {
              e.preventDefault();
            }
          }}
          className="hover:text-zinc-800"
        >
          ← All plans
        </Link>
        {/* New tab, so unsaved edits on this page aren't lost */}
        <Link href="/help" target="_blank" rel="noopener" className="hover:text-zinc-800">
          How it works
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4 mt-1">
        <h1 className="text-xl font-bold w-full md:w-auto">{name}</h1>
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
          onClick={() => setEditingSettings(true)}
          className="hidden md:block px-2 py-1 text-sm rounded border border-zinc-300 hover:bg-zinc-100"
        >
          Plan settings
        </button>
        <button
          onClick={() => setEditingPriorWeeks(true)}
          className="hidden md:block px-2 py-1 text-sm rounded border border-zinc-300 hover:bg-zinc-100"
        >
          Prior weeks
        </button>
        <button
          onClick={() => setEditingBlocks((prev) => !prev)}
          aria-pressed={editingBlocks}
          className={`hidden md:block px-2 py-1 text-sm rounded border border-zinc-300 hover:bg-zinc-100 ${editingBlocks ? "bg-zinc-200" : ""}`}
        >
          {editingBlocks ? "Edit blocks ✓" : "Edit blocks"}
        </button>
        <div className="relative md:hidden">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="More actions"
            aria-expanded={menuOpen}
            className="px-3 py-1 text-sm rounded border border-zinc-300 active:bg-zinc-100"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute left-0 top-full mt-1 z-40 w-44 rounded border border-zinc-200 bg-white shadow-lg py-1">
              {[
                { label: "Plan settings", action: () => setEditingSettings(true) },
                { label: "Prior weeks", action: () => setEditingPriorWeeks(true) },
                {
                  label: editingBlocks ? "Edit blocks ✓" : "Edit blocks",
                  action: () => setEditingBlocks((prev) => !prev),
                },
              ].map(({ label, action }) => (
                <button
                  key={label}
                  onClick={() => {
                    setMenuOpen(false);
                    action();
                  }}
                  className="block w-full text-left px-3 py-2 text-sm active:bg-zinc-100"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={save}
          disabled={saved || saving || saveState.conflict}
          className="ml-auto md:ml-0 px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
      </div>
      {saveState.failed && !saving && (
        <div className="mb-4 text-sm border border-red-200 bg-red-50 rounded p-3 flex items-center gap-3">
          <p className="text-red-700">
            Your changes couldn&apos;t be saved. They&apos;re still here, so check your connection and
            try again.
          </p>
          <button
            onClick={save}
            className="ml-auto px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 whitespace-nowrap"
          >
            Retry
          </button>
        </div>
      )}
      {saveState.conflict && (
        <div className="mb-4 text-sm border border-red-200 bg-red-50 rounded p-3 flex items-center gap-3">
          <p className="text-red-700">
            This plan was changed somewhere else since you opened it, so your changes weren&apos;t
            saved. Reload to get the latest version. Unsaved changes here will be lost.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 whitespace-nowrap"
          >
            Reload
          </button>
        </div>
      )}
      <div className="hidden md:grid gap-px mb-1" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) repeat(7, minmax(0, 1fr))' }}>
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
        return (
          <div
            key={summary.startDate}
            className="relative"
            onDragOver={(e) => handleBlockDragOver(e, summary.startDate, i)}
            onDragLeave={handleBlockDragLeave}
            onDrop={(e) => handleBlockDrop(e, summary.startDate, i)}
          >
            {blockDropTarget === summary.startDate && (
              <div className="pointer-events-none absolute top-0 inset-x-0 h-6 z-20 border-2 border-dashed border-blue-400" />
            )}
            {blockStarts.includes(summary.startDate) ? (
              <BlockBar
                weekStart={summary.startDate}
                editable={editingBlocks}
                onDragStart={() => setDraggingBlock(summary.startDate)}
                onDragEnd={handleBlockDragEnd}
                onRemove={() => handleBlockRemove(summary.startDate)}
              />
            ) : (
              i > 0 && editingBlocks && (
                <AddBlockGap onAdd={() => handleBlockAdd(summary.startDate)} />
              )
            )}
            <WeekRow
              summary={summary}
              activities={weekActivities}
              dayOffset={i * 7}
              expanded={expandedWeeks.has(summary.startDate)}
              onToggle={() => toggleWeek(summary.startDate)}
              onAddPriorWeeks={
                i === 0 && priorWeeklyDistances.length === 0 ? () => setEditingPriorWeeks(true) : undefined
              }
              onDayEdit={setEditingDate}
              onStatusChange={handleStatusChange}
              onActivityMove={handleActivityMove}
            />
            <MobileWeekCard
              summary={summary}
              activities={weekActivities}
              expanded={expandedWeeks.has(summary.startDate)}
              onToggle={() => toggleWeek(summary.startDate)}
              onAddPriorWeeks={
                i === 0 && priorWeeklyDistances.length === 0 ? () => setEditingPriorWeeks(true) : undefined
              }
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

      {editingSettings && (
        <PlanSettingsModal
          current={{ name, startDate, weekCount, activities, blockStarts }}
          onSave={handleSettingsEdit}
          onClose={() => setEditingSettings(false)}
          onDelete={() => startDeleting(() => deletePlanAction(plan.id))}
          deleting={deleting}
        />
      )}

      {editingPriorWeeks && (
        <PriorWeeksModal
          planStartDate={startDate}
          priorWeeklyDistances={priorWeeklyDistances}
          onSave={handlePriorWeeksEdit}
          onClose={() => setEditingPriorWeeks(false)}
        />
      )}
    </div>
  );
}
