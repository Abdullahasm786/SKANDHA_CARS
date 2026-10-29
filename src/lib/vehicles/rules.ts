import type { InventoryStatus, PublicationStatus } from "@/lib/types";

export type StatusKind = "inventory" | "publication";

const INVENTORY: Record<InventoryStatus, InventoryStatus[]> = {
  available: ["reserved", "sold"],
  reserved: ["available", "sold"],
  sold: ["available"], // restoring a sold car is allowed and audited
};
const PUBLICATION: Record<PublicationStatus, PublicationStatus[]> = {
  draft: ["published", "archived"],
  published: ["draft", "archived"],
  archived: ["draft"], // archived cars must go through draft before being published again
};

export function canTransition(kind: StatusKind, from: string, to: string): boolean {
  const map = (kind === "inventory" ? INVENTORY : PUBLICATION) as Record<string, string[]>;
  return Boolean(map[from]?.includes(to));
}

type Listing = { price_inr: number; images?: unknown[] | number };
const photoCount = (v: Listing) => (typeof v.images === "number" ? v.images : v.images?.length ?? 0);

/** Reasons a vehicle cannot be published. Empty = publishable. */
export function publishBlockers(v: Listing): string[] {
  const out: string[] = [];
  if (photoCount(v) === 0) out.push("Add at least one photo");
  if (!(v.price_inr > 0)) out.push("Set an asking price");
  return out;
}

/** Reasons a vehicle will not appear in the public Featured section. Empty = eligible. */
export function featureBlockers(v: Listing & { publication_status: string; inventory_status: string }): string[] {
  const out: string[] = [];
  if (v.publication_status !== "published") out.push(`Not published (${v.publication_status})`);
  if (v.inventory_status !== "available") out.push(`Not available (${v.inventory_status})`);
  if (photoCount(v) === 0) out.push("No photo");
  return out;
}

/** Cars with identical year, kilometres and price are flagged for the owner to review (never auto-merged). */
export function duplicateKey(v: { model_year: number; odometer_km: number | null; price_inr: number }): string | null {
  return v.odometer_km == null ? null : `${v.model_year}|${v.odometer_km}|${v.price_inr}`;
}
