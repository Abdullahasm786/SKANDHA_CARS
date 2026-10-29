"use server";
import { randomUUID } from "node:crypto";
import { getAdminOrNull } from "@/lib/auth/require-admin";
import { getDb, mongoClient } from "@/lib/db/mongo";
import { historyRows, lifecycleFields, type HistoryRow } from "@/lib/db/vehicle-model";
import { fieldErrors, formToObject } from "@/lib/validation/common";
import { statusChangeSchema, toVehicleRow, vehicleSchema } from "@/lib/validation/vehicle";
import { slugify, uniqueSlug } from "@/lib/utils/slug";
import { canTransition, publishBlockers } from "@/lib/vehicles/rules";
import { deleteImages } from "@/lib/storage/cloudinary";
import { refreshPublic } from "./common";

export type VehicleResult = { ok: boolean; id?: string; message?: string; errors?: Record<string, string> };
type VDoc = { _id: string; slug: string; inventory_status: "available" | "reserved" | "sold"; publication_status: "draft" | "published" | "archived"; published_at?: Date | null; price_inr: number; is_featured?: boolean; images?: Array<{ storage_path: string }>; [k: string]: unknown };

export async function createVehicle(fd: FormData): Promise<VehicleResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, message: "You are not authorized." };
  const parsed = vehicleSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const v = parsed.data;
  const db = await getDb();
  const col = db.collection<VDoc>("vehicles");
  const slug = await uniqueSlug([v.model_year, v.make, v.model, v.variant].filter(Boolean).join(" "), async (s) => Boolean(await col.findOne({ slug: s }, { projection: { _id: 1 } })));
  const row = toVehicleRow(v);
  const now = new Date();
  const id = randomUUID();
  try {
    await col.insertOne({ _id: id, slug, ...row, images: [], created_at: now, updated_at: now, published_at: null, sold_at: null, archived_at: null, ...lifecycleFields(null, row, now) } as never);
    await db.collection<HistoryRow>("vehicle_status_history").insertMany(historyRows(id, null, row, admin.id, "created", randomUUID));
  } catch { return { ok: false, message: "Could not create the vehicle." }; }
  refreshPublic();
  return { ok: true, id };
}

export async function updateVehicle(id: string, fd: FormData): Promise<VehicleResult> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, message: "You are not authorized." };
  const parsed = vehicleSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const db = await getDb();
  const col = db.collection<VDoc>("vehicles");
  const prev = await col.findOne({ _id: id });
  if (!prev) return { ok: false, message: "Vehicle not found." };
  const row = toVehicleRow(parsed.data);
  for (const kind of ["inventory", "publication"] as const) {
    const from = prev[`${kind}_status`], to = row[`${kind}_status`];
    if (from !== to && !canTransition(kind, from, to)) return { ok: false, message: `A ${kind === "inventory" ? "car" : "listing"} can't change from ${from} to ${to}.` };
  }
  if (row.publication_status === "published" && prev.publication_status !== "published") {
    const blockers = publishBlockers({ price_inr: row.price_inr, images: prev.images ?? [] });
    if (blockers.length) return { ok: false, message: `Can't publish yet: ${blockers.join("; ")}.` };
  }
  const set: Record<string, unknown> = { ...row, ...lifecycleFields(prev, row), updated_at: new Date() };
  const wanted = slugify(String(fd.get("slug") ?? ""));
  if (wanted && wanted !== prev.slug) {
    if (await col.findOne({ slug: wanted, _id: { $ne: id } })) return { ok: false, errors: { slug: "That URL slug is already used by another car." }, message: "Please fix the highlighted fields." };
    set.slug = wanted;
    await db.collection("vehicle_slug_redirects").deleteOne({ _id: wanted } as never);
    await db.collection("vehicle_slug_redirects").replaceOne({ _id: prev.slug } as never, { _id: prev.slug, vehicle_id: id, created_at: new Date() } as never, { upsert: true });
  }
  await col.updateOne({ _id: id }, { $set: set as never });
  const hist = historyRows(id, prev, row, admin.id, null, randomUUID);
  if (hist.length) await db.collection<HistoryRow>("vehicle_status_history").insertMany(hist);
  refreshPublic();
  return { ok: true, id };
}

/** Status change + audit row in one transaction (Atlas replica set). */
export async function changeStatus(input: { id: string; kind: "inventory" | "publication"; status: string; reason?: string }): Promise<{ ok: boolean; message: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, message: "You are not authorized." };
  const parsed = statusChangeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid request." };
  const { id, kind, status, reason } = parsed.data;
  const client = await mongoClient();
  const db = await getDb();
  const session = client.startSession();
  try {
    let found = true;
    let blocked: string | null = null;
    await session.withTransaction(async () => {
      const col = db.collection<VDoc>("vehicles");
      const prev = await col.findOne({ _id: id }, { session });
      if (!prev) { found = false; return; }
      if (prev[`${kind}_status`] === status) { blocked = `It is already ${status}.`; return; }
      if (!canTransition(kind, prev[`${kind}_status`], status)) { blocked = `Can't change from ${prev[`${kind}_status`]} to ${status}.`; return; }
      if (kind === "publication" && status === "published") {
        const b = publishBlockers({ price_inr: prev.price_inr, images: prev.images ?? [] });
        if (b.length) { blocked = `Can't publish yet: ${b.join("; ")}.`; return; }
      }
      const next = { inventory_status: prev.inventory_status, publication_status: prev.publication_status, [`${kind}_status`]: status } as Pick<VDoc, "inventory_status" | "publication_status">;
      await col.updateOne({ _id: id }, { $set: { [`${kind}_status`]: status, ...lifecycleFields(prev, next), updated_at: new Date() } } as never, { session });
      const rows = historyRows(id, prev, next, admin.id, reason ?? null, randomUUID);
      if (rows.length) await db.collection<HistoryRow>("vehicle_status_history").insertMany(rows, { session });
    });
    if (!found) return { ok: false, message: "Vehicle not found." };
    if (blocked) return { ok: false, message: blocked };
  } catch { return { ok: false, message: "Could not update the status. Nothing was changed." }; }
  finally { await session.endSession(); }
  refreshPublic();
  return { ok: true, message: `Status updated to ${status}.` };
}

export async function toggleFeatured(id: string): Promise<{ ok: boolean; message: string }> {
  if (!(await getAdminOrNull())) return { ok: false, message: "You are not authorized." };
  const col = (await getDb()).collection<VDoc>("vehicles");
  const v = await col.findOne({ _id: id });
  if (!v) return { ok: false, message: "Vehicle not found." };
  await col.updateOne({ _id: id }, { $set: { is_featured: !v.is_featured, updated_at: new Date() } });
  refreshPublic();
  return { ok: true, message: v.is_featured ? "Removed from featured." : "Marked as featured." };
}

/** Permanently removes a vehicle, its history, redirects and photos. Requires the caller to confirm in the UI. */
export async function deleteVehicle(id: string): Promise<{ ok: boolean; message: string }> {
  if (!(await getAdminOrNull())) return { ok: false, message: "You are not authorized." };
  const db = await getDb();
  const v = await db.collection<VDoc>("vehicles").findOne({ _id: id });
  if (!v) return { ok: false, message: "Vehicle not found." };
  await Promise.all([
    db.collection<VDoc>("vehicles").deleteOne({ _id: id }),
    db.collection("vehicle_status_history").deleteMany({ vehicle_id: id }),
    db.collection("vehicle_slug_redirects").deleteMany({ vehicle_id: id }),
  ]);
  await deleteImages((v.images ?? []).map((i) => i.storage_path).filter((p) => !p.startsWith("/")));
  refreshPublic();
  return { ok: true, message: "Vehicle deleted." };
}

/** Applies one inventory status to several vehicles; each is validated and audited individually. */
export async function bulkSetInventoryStatus(ids: string[], status: "available" | "reserved" | "sold"): Promise<{ ok: boolean; message: string }> {
  if (ids.length === 0 || ids.length > 100) return { ok: false, message: "Select between 1 and 100 vehicles." };
  let done = 0; const failed: string[] = [];
  for (const id of ids) {
    const r = await changeStatus({ id, kind: "inventory", status, reason: "bulk update" });
    if (r.ok) done++; else failed.push(r.message);
  }
  return { ok: done > 0, message: `${done} updated${failed.length ? `, ${failed.length} skipped (already ${status} or not allowed)` : ""}.` };
}
