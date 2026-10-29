"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="display text-3xl">Something went wrong</h1>
      <p className="mt-3 text-muted">We couldn&apos;t load this page. Please try again.</p>
      <button className="btn btn-primary mt-6" onClick={reset}>Try again</button>
    </main>
  );
}
