"use client";
import { AlertTriangle } from "lucide-react";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-line-strong px-6 py-16 text-center">
      <AlertTriangle size={26} className="text-danger" aria-hidden />
      <h1 className="mt-3 text-lg font-semibold">Something went wrong</h1>
      <p className="mt-1 max-w-sm text-sm text-muted">This page couldn&apos;t load. Nothing was changed. Try again, and if it keeps happening check the database connection.</p>
      <button className="btn btn-primary mt-4" onClick={reset}>Try again</button>
    </div>
  );
}
