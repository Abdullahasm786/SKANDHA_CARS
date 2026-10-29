import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="display text-3xl">You&apos;re offline</h1>
      <p className="mt-4 text-muted">
        This page isn&apos;t saved on your device. Car availability and prices change, so reconnect to see current listings.
      </p>
      <Link href="/" className="btn mt-8">Try the home page</Link>
    </main>
  );
}
