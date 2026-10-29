"use client";
import { Eye, MoreHorizontal, Pencil, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { changeStatus, deleteVehicle, toggleFeatured } from "@/actions/vehicles";
import { canTransition } from "@/lib/vehicles/rules";
import { ConfirmDialog } from "./ConfirmDialog";
import { useToast } from "./Toast";

export interface ActionVehicle { id: string; title: string; slug: string; inventory: string; publication: string; featured: boolean }
type Pending = { label: string; message: string; danger?: boolean; run: () => Promise<{ ok: boolean; message: string }>; redirect?: string };

const INVENTORY_LABEL: Record<string, string> = { available: "Mark as Available", reserved: "Mark as Reserved", sold: "Mark as Sold" };
const PUBLICATION_LABEL: Record<string, string> = { published: "Publish", draft: "Unpublish (move to draft)", archived: "Archive" };

export function VehicleActions({ v, compact = false, afterDelete }: { v: ActionVehicle; compact?: boolean; afterDelete?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, start] = useTransition();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", click); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", click); document.removeEventListener("keydown", key); };
  }, [open]);

  const inv = (["available", "reserved", "sold"] as const).filter((s) => canTransition("inventory", v.inventory, s));
  const pub = (["published", "draft", "archived"] as const).filter((s) => canTransition("publication", v.publication, s));

  const ask = (p: Pending) => { setOpen(false); setPending(p); };
  function run() {
    if (!pending) return;
    const p = pending;
    start(async () => {
      const r = await p.run();
      toast(r.ok, r.message); setPending(null);
      if (r.ok) { if (p.redirect) router.push(p.redirect); else router.refresh(); }
    });
  }
  const status = (kind: "inventory" | "publication", s: string, label: string, message: string, danger = false): Pending => ({
    label, message, danger, run: () => changeStatus({ id: v.id, kind, status: s }),
  });

  return (
    <div className="relative flex items-center justify-end gap-1" ref={box}>
      {!compact && (<>
        <Link href={`/admin/cars/${v.id}`} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2" aria-label={`View ${v.title}`} title="View"><Eye size={16} aria-hidden /></Link>
        <Link href={`/admin/cars/${v.id}/edit`} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2" aria-label={`Edit ${v.title}`} title="Edit"><Pencil size={16} aria-hidden /></Link>
      </>)}
      <button className={compact ? "btn btn-sm" : "grid h-8 w-8 place-items-center rounded-lg hover:bg-surface-2"} aria-haspopup="menu" aria-expanded={open} aria-label={`More actions for ${v.title}`} onClick={() => setOpen((o) => !o)}>
        <MoreHorizontal size={16} aria-hidden />{compact && "Actions"}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-60 rounded-xl border border-line bg-surface p-1.5 text-sm shadow-xl">
          {inv.map((s) => <button key={s} role="menuitem" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-surface-2"
            onClick={() => ask(status("inventory", s, INVENTORY_LABEL[s], s === "sold" ? "It will be removed from available inventory and labelled Sold on the website. You can restore it later." : s === "reserved" ? "It will be shown as Reserved to customers." : "It will be shown as Available.", s === "sold"))}>{INVENTORY_LABEL[s]}</button>)}
          <hr className="my-1 border-line" />
          {pub.map((s) => <button key={s} role="menuitem" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-surface-2"
            onClick={() => ask(status("publication", s, PUBLICATION_LABEL[s].split(" (")[0], s === "published" ? "It will become visible on the public website." : s === "archived" ? "It will be hidden from the website. The record is kept." : "It will no longer be visible to customers.", s === "archived"))}>{PUBLICATION_LABEL[s]}</button>)}
          <button role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-surface-2"
            onClick={() => { setOpen(false); start(async () => { const r = await toggleFeatured(v.id); toast(r.ok, r.message); if (r.ok) router.refresh(); }); }}>
            <Star size={14} aria-hidden />{v.featured ? "Remove from featured" : "Mark as featured"}</button>
          {v.publication === "published" && <Link role="menuitem" href={`/cars/${v.slug}`} target="_blank" className="block rounded-lg px-3 py-2 hover:bg-surface-2">Preview on website</Link>}
          <hr className="my-1 border-line" />
          <button role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-danger hover:bg-danger-bg"
            onClick={() => ask({ label: "Delete permanently", danger: true, message: "This permanently deletes the vehicle, its photos and its status history. This cannot be undone. Consider Archive instead.", run: () => deleteVehicle(v.id), redirect: afterDelete })}>
            <Trash2 size={14} aria-hidden />Delete…</button>
        </div>
      )}
      <ConfirmDialog open={Boolean(pending)} title={pending?.label ?? ""} confirmLabel={pending?.label ?? "Confirm"} danger={pending?.danger} busy={busy} onConfirm={run} onCancel={() => setPending(null)}>
        <p><strong className="text-fg">{v.title}</strong></p><p className="mt-2">{pending?.message}</p>
      </ConfirmDialog>
    </div>
  );
}
