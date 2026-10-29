"use client";
import { ArrowDown, ArrowUp, ArrowUpDown, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { bulkSetInventoryStatus, toggleFeatured } from "@/actions/vehicles";
import { formatDate, formatINR, formatKm, label, vehicleTitle } from "@/lib/utils/format";
import type { VehicleWithRelations } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";
import { VehicleActions } from "./VehicleActions";
import { VehicleStatusBadge } from "./ui";
import { VehicleThumb } from "./VehicleThumb";

const DASH = <span className="text-muted" aria-label="Not provided">—</span>;
export type SortHrefs = Record<string, { href: string; dir: "asc" | "desc" | null }>;

function Th({ k, sortHrefs, children }: { k?: string; sortHrefs: SortHrefs; children: React.ReactNode }) {
  const s = k ? sortHrefs[k] : undefined;
  return (
    <th scope="col" className="th" aria-sort={s?.dir === "asc" ? "ascending" : s?.dir === "desc" ? "descending" : undefined}>
      {s ? <Link href={s.href} className="inline-flex items-center gap-1 hover:text-fg">{children}{s.dir === "asc" ? <ArrowUp size={12} aria-hidden /> : s.dir === "desc" ? <ArrowDown size={12} aria-hidden /> : <ArrowUpDown size={12} className="opacity-40" aria-hidden />}</Link> : children}
    </th>
  );
}

export function VehicleList({ rows, view, sortHrefs }: { rows: VehicleWithRelations[]; view: "table" | "grid"; sortHrefs: SortHrefs }) {
  const router = useRouter();
  const toast = useToast();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [bulk, setBulk] = useState<"available" | "reserved" | "sold" | null>(null);
  const [busy, start] = useTransition();
  const allOn = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const feat = (id: string) => start(async () => { const r = await toggleFeatured(id); toast(r.ok, r.message); if (r.ok) router.refresh(); });
  const actionOf = (v: VehicleWithRelations) => ({ id: v.id, title: vehicleTitle(v), slug: v.slug, inventory: v.inventory_status, publication: v.publication_status, featured: v.is_featured });

  const runBulk = () => {
    if (!bulk) return;
    start(async () => { const r = await bulkSetInventoryStatus([...sel], bulk); toast(r.ok, r.message); setBulk(null); setSel(new Set()); router.refresh(); });
  };

  return (
    <div>
      {sel.size > 0 && (
        <div className="sticky top-16 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2.5 pl-4 shadow-md" role="region" aria-label="Bulk actions">
          <p className="text-sm font-semibold">{sel.size} selected</p>
          <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
          {(["available", "reserved", "sold"] as const).map((s) => <button key={s} className="btn btn-sm" onClick={() => setBulk(s)}>Mark {s}</button>)}
          <button className="btn btn-sm ml-auto" onClick={() => setSel(new Set())}>Clear selection</button>
        </div>
      )}

      {view === "table" ? (
        <div className="card overflow-x-auto" data-allow-overflow>
          <table className="w-full min-w-[980px] text-sm">
            <caption className="sr-only">Vehicle inventory</caption>
            <thead className="border-b border-line bg-surface-2/50">
              <tr>
                <th scope="col" className="th w-10"><input type="checkbox" aria-label="Select all vehicles on this page" checked={allOn} onChange={() => setSel(allOn ? new Set() : new Set(rows.map((r) => r.id)))} className="h-4 w-4 accent-[var(--accent)]" /></th>
                <Th sortHrefs={sortHrefs}>Vehicle</Th><Th k="year" sortHrefs={sortHrefs}>Year</Th><Th k="price" sortHrefs={sortHrefs}>Price</Th><Th k="km" sortHrefs={sortHrefs}>Mileage</Th><Th sortHrefs={sortHrefs}>Fuel</Th><Th sortHrefs={sortHrefs}>Transmission</Th><Th sortHrefs={sortHrefs}>Status</Th><Th sortHrefs={sortHrefs}>Featured</Th><Th k="updated" sortHrefs={sortHrefs}>Updated</Th>
                <th scope="col" className="th text-right"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((v) => (
                <tr key={v.id} className={sel.has(v.id) ? "bg-accent/5" : "hover:bg-surface-2/40"}>
                  <td className="td"><input type="checkbox" aria-label={`Select ${vehicleTitle(v)}`} checked={sel.has(v.id)} onChange={() => toggle(v.id)} className="h-4 w-4 accent-[var(--accent)]" /></td>
                  <td className="td">
                    <Link href={`/admin/cars/${v.id}`} className="flex items-center gap-3">
                      <VehicleThumb images={v.images} />
                      <span className="min-w-0"><span className="block max-w-[230px] truncate font-semibold hover:underline">{vehicleTitle(v)}</span>
                        <span className="block text-xs text-muted">{v.make} · {v.model}{v.colour ? ` · ${v.colour}` : ""}</span></span>
                    </Link>
                  </td>
                  <td className="td">{v.model_year}</td>
                  <td className="td whitespace-nowrap font-semibold">{formatINR(v.price_inr)}</td>
                  <td className="td whitespace-nowrap">{v.odometer_km != null ? formatKm(v.odometer_km) : DASH}</td>
                  <td className="td">{v.fuel_type ? label(v.fuel_type) : DASH}</td>
                  <td className="td">{v.transmission ? label(v.transmission) : DASH}</td>
                  <td className="td"><div className="flex flex-col items-start gap-1"><VehicleStatusBadge status={v.inventory_status} />{v.publication_status !== "published" && <VehicleStatusBadge status={v.publication_status} />}</div></td>
                  <td className="td"><button onClick={() => feat(v.id)} disabled={busy} aria-pressed={v.is_featured} aria-label={`${v.is_featured ? "Unfeature" : "Feature"} ${vehicleTitle(v)}`} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2"><Star size={16} className={v.is_featured ? "fill-warn text-warn" : "text-muted"} aria-hidden /></button></td>
                  <td className="td whitespace-nowrap text-muted">{formatDate(v.updated_at)}</td>
                  <td className="td"><VehicleActions v={actionOf(v)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((v) => (
            <li key={v.id} className="card overflow-hidden">
              <Link href={`/admin/cars/${v.id}`} className="block"><VehicleThumb images={v.images} className="!h-44 !w-full !rounded-none" /></Link>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2"><Link href={`/admin/cars/${v.id}`} className="font-semibold hover:underline">{vehicleTitle(v)}</Link>
                  <input type="checkbox" aria-label={`Select ${vehicleTitle(v)}`} checked={sel.has(v.id)} onChange={() => toggle(v.id)} className="mt-1 h-4 w-4 accent-[var(--accent)]" /></div>
                <p className="mt-1 text-lg font-bold">{formatINR(v.price_inr)}</p>
                <p className="mt-1 text-xs text-muted">{[v.odometer_km != null && formatKm(v.odometer_km), label(v.fuel_type), label(v.transmission)].filter(Boolean).join(" · ") || "—"}</p>
                <div className="mt-3 flex items-center justify-between"><div className="flex gap-1.5"><VehicleStatusBadge status={v.inventory_status} />{v.publication_status !== "published" && <VehicleStatusBadge status={v.publication_status} />}</div>
                  <VehicleActions v={actionOf(v)} /></div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog open={Boolean(bulk)} title={`Mark ${sel.size} vehicle${sel.size === 1 ? "" : "s"} as ${bulk}`} confirmLabel="Apply" danger={bulk === "sold"} busy={busy} onConfirm={runBulk} onCancel={() => setBulk(null)}>
        <p>Each change is checked against the allowed status rules and logged in the activity history. Cars already in that status are skipped.</p>
      </ConfirmDialog>
    </div>
  );
}
