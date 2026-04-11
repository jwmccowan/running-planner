"use client";

import { useState } from "react";
import type { Activity, ActivityType } from "@/lib/types";

type DraftActivity = {
  id: string;
  name: string;
  type: ActivityType;
  distance: string;
  intenseDistance: string;
};

function toDraft(a: Activity): DraftActivity {
  return {
    id: a.id,
    name: a.name,
    type: a.type,
    distance: String(a.distance),
    intenseDistance: String(a.intenseDistance),
  };
}

function fromDraft(d: DraftActivity, date: string): Activity {
  return {
    id: d.id,
    name: d.name,
    date,
    type: d.type,
    distance: parseFloat(d.distance) || 0,
    intenseDistance: parseFloat(d.intenseDistance) || 0,
  };
}

function newDraft(): DraftActivity {
  return {
    id: crypto.randomUUID(),
    name: "Easy run",
    type: "run",
    distance: "0",
    intenseDistance: "0",
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function DayEditorModal({
  date,
  activities,
  onSave,
  onClose,
}: {
  date: string;
  activities: Activity[];
  onSave: (activities: Activity[]) => void;
  onClose: () => void;
}) {
  const [drafts, setDrafts] = useState<DraftActivity[]>(activities.map(toDraft));

  function updateDraft(id: string, patch: Partial<DraftActivity>) {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function removeDraft(id: string) {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  function handleSave() {
    onSave(drafts.map((d) => fromDraft(d, date)));
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
        <h2 className="text-base font-semibold mb-4">{formatDate(date)}</h2>

        <div className="flex flex-col gap-3">
          {drafts.length === 0 && (
            <p className="text-sm text-zinc-400 italic">No activities</p>
          )}
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className="flex flex-col gap-2 border border-zinc-200 rounded p-3"
            >
              <div className="flex gap-2 items-center">
                <select
                  value={draft.type}
                  onChange={(e) =>
                    updateDraft(draft.id, { type: e.target.value as ActivityType })
                  }
                  className="text-sm border border-zinc-300 rounded px-1 py-0.5"
                >
                  <option value="run">Run</option>
                  <option value="gym">Gym</option>
                  <option value="rest">Rest</option>
                </select>
                <input
                  value={draft.name}
                  onChange={(e) => updateDraft(draft.id, { name: e.target.value })}
                  placeholder="Name"
                  className="flex-1 text-sm border border-zinc-300 rounded px-2 py-0.5"
                />
                <button
                  onClick={() => removeDraft(draft.id)}
                  className="text-zinc-400 hover:text-red-600 text-sm px-1"
                >
                  ✕
                </button>
              </div>

              {draft.type !== "rest" && (
                <div className="flex gap-3 items-center text-sm">
                  <label className="text-zinc-500 w-24">Distance (km)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={draft.distance}
                    onChange={(e) => updateDraft(draft.id, { distance: e.target.value })}
                    className="w-20 border border-zinc-300 rounded px-2 py-0.5 text-sm"
                  />
                </div>
              )}

              {draft.type === "run" && (
                <div className="flex gap-3 items-center text-sm">
                  <label className="text-zinc-500 w-24">Intense (km)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={draft.intenseDistance}
                    onChange={(e) =>
                      updateDraft(draft.id, { intenseDistance: e.target.value })
                    }
                    className="w-20 border border-zinc-300 rounded px-2 py-0.5 text-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setDrafts((prev) => [...prev, newDraft()])}
          className="mt-3 text-sm text-blue-600 hover:text-blue-800"
        >
          + Add activity
        </button>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-zinc-600 hover:text-zinc-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
