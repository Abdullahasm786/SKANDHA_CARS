"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { changeStatus } from "@/actions/vehicles";
import { ConfirmDialog } from "./ConfirmDialog";

type Action = { kind: "inventory" | "publication"; status: string; label: string; danger?: boolean; confirm: string };

export function StatusControls({ id, title, inventory, publication }: { id: string; title: string; inventory: string; publication: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<Action | null>(null);
  const [busy, start] = useTransition();
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const actions: Action[] = [];
  if (inventory === "sold") actions.push({ kind: "inventory", status: "available", label: "Mark as Available", confirm: "This returns the car to available inventory." });
  else {
    actions.push({ kind: "inventory", status: "sold", label: "Mark as Sold", danger: true, confirm: "It will be removed from available inventory and the sitemap and labelled sold. The record and photos are kept. You can reverse this." });
    if (inventory === "available") actions.push({ kind: "inventory", status: "reserved", label: "Reserve", confirm: "It will be shown as reserved." });
    if (inventory === "reserved") actions.push({ kind: "inventory", status: "available", label: "Mark as Available", confirm: "It will be shown as available again." });
  }
  if (publication === "archived") actions.push({ kind: "publication", status: "draft", label: "Restore", confirm: "It will be restored as a draft (not public) until you publish it." });
  else {
    actions.push(publication === "published"
      ? { kind: "publication", status: "draft", label: "Unpublish", confirm: "It will no longer be visible to the public." }
      : { kind: "publication", status: "published", label: "Publish", confirm: "It will be visible on the public website." });
    actions.push({ kind: "publication", status: "archived", label: "Archive", danger: true, confirm: "It will be hidden from the public. The record is kept." });
  }

  function run() {
    if (!pending) return;
    const a = pending;
    start(async () => {
      const res = await changeStatus({ id, kind: a.kind, status: a.status });
      setNote({ ok: res.ok, text: res.message });
      setPending(null);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((a) => <button key={a.label} className={`btn btn-sm ${a.danger ? "btn-danger" : ""}`} onClick={() => setPending(a)}>{a.label}</button>)}
      </div>
      <p role="status" className={`mt-1 text-xs ${note?.ok ? "text-success" : "text-danger"}`}>{note?.text}</p>
      <ConfirmDialog open={Boolean(pending)} title={pending?.label ?? ""} confirmLabel={pending?.label ?? ""} danger={pending?.danger} busy={busy} onConfirm={run} onCancel={() => setPending(null)}>
        <p><strong className="text-fg">{title}</strong></p>
        <p className="mt-2">{pending?.confirm}</p>
      </ConfirmDialog>
    </div>
  );
}
