"use client";

import { useState, useTransition } from "react";
import { createPlanAction } from "@/app/actions";
import { addDays } from "@/lib/plan-settings";
import PlanSettingsModal from "./PlanSettingsModal";

const DEFAULT_WEEKS = 16;

function nextMonday(): string {
  const today = new Date().toLocaleDateString("en-CA");
  const day = new Date(today + "T00:00:00Z").getUTCDay();
  return addDays(today, ((8 - day) % 7) || 7);
}

export default function NewPlanButton() {
  const [open, setOpen] = useState(false);
  const [creating, startCreating] = useTransition();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={creating}
        className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {creating ? "Creating…" : "+ New plan"}
      </button>
      {open && (
        <PlanSettingsModal
          mode="create"
          current={{
            name: "",
            startDate: nextMonday(),
            weekCount: DEFAULT_WEEKS,
            activities: [],
            blockStarts: [],
          }}
          onSave={({ name, startDate, weekCount }) => {
            setOpen(false);
            startCreating(() => createPlanAction({ name, startDate, weekCount }));
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
