"use client";

import Link from "next/link";

export default function Error({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
      <p className="text-sm text-zinc-700 mb-4">
        This page couldn&apos;t be loaded. It may be a temporary problem, so try again.
      </p>
      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={() => unstable_retry()}
          className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Try again
        </button>
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          All plans
        </Link>
      </div>
    </div>
  );
}
