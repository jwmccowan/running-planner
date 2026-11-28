"use client";

import { useState, useTransition } from "react";
import { deleteAccountAction } from "@/app/actions";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/lib/account";

export default function DeleteAccountForm({ ownedPlanCount }: { ownedPlanCount: number }) {
  const [typed, setTyped] = useState("");
  const [deleting, startDeleting] = useTransition();
  const confirmed = typed.trim().toLowerCase() === DELETE_ACCOUNT_CONFIRMATION;

  return (
    <div className="border border-red-200 bg-red-50 rounded p-4 text-sm">
      <h2 className="text-base font-semibold text-red-800 mb-1">Delete my account</h2>
      <p className="text-red-700 mb-3">
        This deletes your account and{" "}
        {ownedPlanCount === 0
          ? "signs you out"
          : `your ${ownedPlanCount} ${ownedPlanCount === 1 ? "plan" : "plans"}, then signs you out`}
        . It can&apos;t be undone.
      </p>
      <label className="block text-red-800 mb-1" htmlFor="delete-confirmation">
        Type &ldquo;{DELETE_ACCOUNT_CONFIRMATION}&rdquo; to confirm
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="delete-confirmation"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          className="flex-1 min-w-0 border border-red-300 rounded px-2 py-1 text-sm bg-white"
        />
        <button
          onClick={() => startDeleting(() => deleteAccountAction(typed))}
          disabled={!confirmed || deleting}
          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {deleting ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </div>
  );
}
