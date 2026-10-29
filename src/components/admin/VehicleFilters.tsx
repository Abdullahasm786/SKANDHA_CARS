"use client";
import { LayoutGrid, List, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useTransition } from "react";

const FIELDS = ["q", "status", "pub", "make", "minYear", "maxYear", "minPrice", "maxPrice"] as const;

export function VehicleFilters({ makes, view }: { makes: string[]; view: "table" | "grid" }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const set = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    next.delete("page");
    start(() => router.replace(`${path}${next.size ? `?${next}` : ""}`));
  };
  const debounced = (k: string, v: string) => { clearTimeout(timer.current); timer.current = setTimeout(() => set({ [k]: v }), 350); };
  const active = FIELDS.some((f) => sp.get(f));
  const viewHref = (v: string) => { const n = new URLSearchParams(sp.toString()); if (v === "table") n.delete("view"); else n.set("view", v); return `${path}?${n}`; };
  const key = sp.toString();

  return (
    <div className="card mb-4 p-3" role="search" aria-busy={pending} key={key}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
        <div className="relative">
          <label htmlFor="f-q" className="sr-only">Search</label>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input id="f-q" defaultValue={sp.get("q") ?? ""} onChange={(e) => debounced("q", e.target.value)} placeholder="Search make, model, variant…" className="field !pl-9" />
        </div>
        <div><label htmlFor="f-status" className="sr-only">Status</label>
          <select id="f-status" className="field" defaultValue={sp.get("status") ?? ""} onChange={(e) => set({ status: e.target.value })}>
            <option value="">All statuses</option><option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option></select></div>
        <div><label htmlFor="f-pub" className="sr-only">Listing</label>
          <select id="f-pub" className="field" defaultValue={sp.get("pub") ?? ""} onChange={(e) => set({ pub: e.target.value })}>
            <option value="">All listings</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>
        <div><label htmlFor="f-make" className="sr-only">Make</label>
          <select id="f-make" className="field" defaultValue={sp.get("make") ?? ""} onChange={(e) => set({ make: e.target.value })}>
            <option value="">All makes</option>{makes.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-[repeat(4,1fr)_auto_auto_auto]">
        <input aria-label="Year from" type="number" inputMode="numeric" placeholder="Year from" className="field" defaultValue={sp.get("minYear") ?? ""} onChange={(e) => debounced("minYear", e.target.value)} />
        <input aria-label="Year to" type="number" inputMode="numeric" placeholder="Year to" className="field" defaultValue={sp.get("maxYear") ?? ""} onChange={(e) => debounced("maxYear", e.target.value)} />
        <input aria-label="Minimum price in rupees" type="number" inputMode="numeric" placeholder="Min price ₹" className="field" defaultValue={sp.get("minPrice") ?? ""} onChange={(e) => debounced("minPrice", e.target.value)} />
        <input aria-label="Maximum price in rupees" type="number" inputMode="numeric" placeholder="Max price ₹" className="field" defaultValue={sp.get("maxPrice") ?? ""} onChange={(e) => debounced("maxPrice", e.target.value)} />
        <div><label htmlFor="f-sort" className="sr-only">Sort</label>
          <select id="f-sort" className="field" defaultValue={`${sp.get("sort") ?? "updated"}:${sp.get("dir") ?? "desc"}`} onChange={(e) => { const [s, d] = e.target.value.split(":"); set({ sort: s === "updated" && d === "desc" ? "" : s, dir: s === "updated" && d === "desc" ? "" : d }); }}>
            <option value="updated:desc">Recently updated</option><option value="added:desc">Newest added</option><option value="price:asc">Price: low to high</option><option value="price:desc">Price: high to low</option>
            <option value="year:desc">Year: newest</option><option value="year:asc">Year: oldest</option><option value="km:asc">Mileage: lowest</option></select></div>
        <div><label htmlFor="f-size" className="sr-only">Rows per page</label>
          <select id="f-size" className="field" defaultValue={sp.get("size") ?? "20"} onChange={(e) => set({ size: e.target.value === "20" ? "" : e.target.value })}>
            <option value="10">10 / page</option><option value="20">20 / page</option><option value="50">50 / page</option></select></div>
        <div className="flex items-center gap-1" role="group" aria-label="View">
          <Link href={viewHref("table")} aria-label="Table view" aria-current={view === "table"} className={`grid h-[42px] w-10 place-items-center rounded-[10px] border ${view === "table" ? "border-accent bg-accent/10 text-accent-ink" : "border-line-strong"}`}><List size={16} aria-hidden /></Link>
          <Link href={viewHref("grid")} aria-label="Grid view" aria-current={view === "grid"} className={`grid h-[42px] w-10 place-items-center rounded-[10px] border ${view === "grid" ? "border-accent bg-accent/10 text-accent-ink" : "border-line-strong"}`}><LayoutGrid size={16} aria-hidden /></Link>
        </div>
      </div>
      {active && <div className="mt-2"><Link href={path} className="inline-flex items-center gap-1 text-xs font-medium text-accent-ink hover:underline"><X size={12} aria-hidden /> Clear filters</Link></div>}
    </div>
  );
}
