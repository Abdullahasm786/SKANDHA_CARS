import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-2 text-5xl">Page not found</h1>
      <p className="mt-4 text-muted">That page doesn&apos;t exist, or the car has been removed.</p>
      <Link href="/#available" className="btn btn-primary mt-8">See available cars</Link>
    </main>
  );
}
