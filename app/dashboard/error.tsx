"use client";

import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[dashboard] Unhandled error", error);
  return (
    <div className="card flex flex-col items-center gap-4 p-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-amber-400/10 text-amber-300">
        <AlertTriangle size={22} />
      </span>
      <div>
        <h2 className="font-semibold text-white">Something went wrong</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-slate-400">
          The dashboard hit an unexpected error while loading. Your data is
          safe — try again.
        </p>
      </div>
      <button type="button" className="btn-secondary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
