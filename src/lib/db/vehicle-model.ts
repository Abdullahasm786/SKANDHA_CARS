import type { InventoryStatus, PublicationStatus } from "@/lib/types";

/** Lifecycle timestamps previously handled by a DB trigger. Returns the fields to $set for a status change. */
export function lifecycleFields(
  prev: { inventory_status?: InventoryStatus; publication_status?: PublicationStatus; published_at?: Date | null } | null,
  next: { inventory_status: InventoryStatus; publication_status: PublicationStatus },
  now = new Date(),
) {
  const f: Record<string, Date | null> = {};
  if (next.publication_status === "published" && !prev?.published_at) f.published_at = now;
  if (next.inventory_status === "sold") { if (prev?.inventory_status !== "sold") f.sold_at = now; } else f.sold_at = null;
  if (next.publication_status === "archived") { if (prev?.publication_status !== "archived") f.archived_at = now; } else f.archived_at = null;
  return f;
}

export interface HistoryRow {
  _id: string; vehicle_id: string; kind: "inventory" | "publication";
  previous_status: string | null; new_status: string; changed_by: string | null; changed_at: Date; reason: string | null;
}

export function historyRows(
  vehicleId: string,
  prev: { inventory_status: string; publication_status: string } | null,
  next: { inventory_status: string; publication_status: string },
  by: string, reason: string | null, id: () => string,
): HistoryRow[] {
  const rows: HistoryRow[] = [];
  const add = (kind: "inventory" | "publication", p: string | null, n: string) =>
    rows.push({ _id: id(), vehicle_id: vehicleId, kind, previous_status: p, new_status: n, changed_by: by, changed_at: new Date(), reason });
  if (!prev || prev.inventory_status !== next.inventory_status) add("inventory", prev?.inventory_status ?? null, next.inventory_status);
  if (!prev || prev.publication_status !== next.publication_status) add("publication", prev?.publication_status ?? null, next.publication_status);
  return rows;
}
