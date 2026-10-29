import { escapeRegex, getDb, serialize } from "@/lib/db/mongo";
import type { Vehicle, VehicleImage, VehicleWithRelations } from "@/lib/types";
import { duplicateKey } from "@/lib/vehicles/rules";

export const ADMIN_PAGE = 20;
export const PAGE_SIZES = [10, 20, 50];
export const SORTS = { updated: "updated_at", price: "price_inr", year: "model_year", km: "odometer_km", added: "created_at" } as const;
export type AdminSort = keyof typeof SORTS;

export interface AdminListParams {
  q?: string; status?: string; pub?: string; make?: string; featured?: boolean;
  minYear?: number; maxYear?: number; minPrice?: number; maxPrice?: number;
  sort?: AdminSort; dir?: "asc" | "desc"; page: number; pageSize?: number;
}

export async function getVehicleById(id: string): Promise<(Vehicle & { images: VehicleImage[] }) | null> {
  const d = await (await getDb()).collection("vehicles").findOne({ _id: id as never });
  if (!d) return null;
  const v = serialize<Vehicle & { images: VehicleImage[] }>(d);
  v.images = [...(v.images ?? [])].sort((a, b) => a.display_order - b.display_order);
  return v;
}

export async function getHistory(vehicleId: string) {
  return serialize<Array<{ id: string; kind: string; previous_status: string | null; new_status: string; changed_at: string; reason: string | null }>>(
    await (await getDb()).collection("vehicle_status_history").find({ vehicle_id: vehicleId }).sort({ changed_at: -1 }).limit(10).toArray());
}

export async function listAdminVehicles(p: AdminListParams) {
  const db = await getDb();
  const q: Record<string, unknown> = {};
  if (p.q) { const r = new RegExp(escapeRegex(p.q.trim().slice(0, 80)), "i"); q.$or = [{ make: r }, { model: r }, { variant: r }, { slug: r }]; }
  if (p.status) q.inventory_status = p.status;
  if (p.pub) q.publication_status = p.pub; else if (!p.status) q.publication_status = { $ne: "archived" };
  if (p.make) q.make = new RegExp(`^${escapeRegex(p.make)}$`, "i");
  if (p.featured) q.is_featured = true;
  const range = (min?: number, max?: number) => ({ ...(min !== undefined && { $gte: min }), ...(max !== undefined && { $lte: max }) });
  if (p.minYear !== undefined || p.maxYear !== undefined) q.model_year = range(p.minYear, p.maxYear);
  if (p.minPrice !== undefined || p.maxPrice !== undefined) q.price_inr = range(p.minPrice, p.maxPrice);
  const size = PAGE_SIZES.includes(p.pageSize ?? 0) ? p.pageSize! : ADMIN_PAGE;
  const sortField = SORTS[p.sort ?? "updated"];
  const col = db.collection("vehicles");
  const [docs, count, makes] = await Promise.all([
    col.find(q).sort({ [sortField]: p.dir === "asc" ? 1 : -1, _id: 1 }).skip((p.page - 1) * size).limit(size).toArray(),
    col.countDocuments(q),
    col.distinct("make") as Promise<string[]>,
  ]);
  const rows = docs.map((d) => {
    const v = serialize<VehicleWithRelations>(d);
    v.images = [...(v.images ?? [])].sort((a, b) => a.display_order - b.display_order);
    return v;
  });
  return { rows, count, pageSize: size, makes: makes.sort((a, b) => a.localeCompare(b)) };
}

type Brief = { id: string; make: string; model: string; variant: string | null; model_year: number; price_inr: number; inventory_status: string; publication_status: string; slug: string; images: VehicleImage[] };
const BRIEF = { make: 1, model: 1, variant: 1, model_year: 1, price_inr: 1, inventory_status: 1, publication_status: 1, slug: 1, images: { $slice: 1 } } as const;

/** Dashboard KPIs. "Total" = every vehicle except archived ones (drafts and sold cars are included). */
export async function dashboardData() {
  const col = (await getDb()).collection("vehicles");
  const [total, available, reserved, sold, drafts, featured, byMonth] = await Promise.all([
    col.countDocuments({ publication_status: { $ne: "archived" } }),
    col.countDocuments({ publication_status: "published", inventory_status: "available" }),
    col.countDocuments({ publication_status: "published", inventory_status: "reserved" }),
    col.countDocuments({ inventory_status: "sold", publication_status: { $ne: "archived" } }),
    col.countDocuments({ publication_status: "draft" }),
    col.countDocuments({ is_featured: true, publication_status: "published", inventory_status: "available" }),
    col.aggregate<{ _id: string; n: number }>([
      { $match: { publication_status: { $ne: "archived" } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } }, n: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray(),
  ]);
  return { stats: { total, available, reserved, sold, drafts, featured }, byMonth: byMonth.map((m) => ({ month: m._id, n: m.n })) };
}

export interface ActivityRow { id: string; kind: string; previous_status: string | null; new_status: string; changed_at: string; reason: string | null; vehicle: Brief | null }

export async function listActivity(page = 1, size = 15): Promise<{ rows: ActivityRow[]; count: number }> {
  const db = await getDb();
  const h = db.collection("vehicle_status_history");
  const [docs, count] = await Promise.all([
    h.find().sort({ changed_at: -1 }).skip((page - 1) * size).limit(size).toArray(), h.countDocuments(),
  ]);
  const ids = [...new Set(docs.map((d) => d.vehicle_id as string))];
  const vs = ids.length ? await db.collection("vehicles").find({ _id: { $in: ids } as never }, { projection: BRIEF }).toArray() : [];
  const map = new Map(vs.map((v) => [String(v._id), serialize<Brief>(v)]));
  return { rows: docs.map((d) => ({ ...serialize<ActivityRow>(d), vehicle: map.get(d.vehicle_id) ?? null })), count };
}

export async function recentVehicles(limit = 5, by: "created_at" | "updated_at" = "created_at"): Promise<Brief[]> {
  const docs = await (await getDb()).collection("vehicles").find({}, { projection: { ...BRIEF, created_at: 1, updated_at: 1 } }).sort({ [by]: -1 }).limit(limit).toArray();
  return serialize<Brief[]>(docs);
}

export async function featuredOverview() {
  const col = (await getDb()).collection("vehicles");
  const [feat, others] = await Promise.all([
    col.find({ is_featured: true }).sort({ updated_at: -1 }).toArray(),
    col.find({ is_featured: { $ne: true }, publication_status: "published", inventory_status: "available" }).sort({ updated_at: -1 }).limit(24).toArray(),
  ]);
  const tidy = (d: unknown) => { const v = serialize<VehicleWithRelations>(d); v.images = [...(v.images ?? [])].sort((a, b) => a.display_order - b.display_order); return v; };
  return { featured: feat.map(tidy), candidates: others.map(tidy) };
}

/** Groups of vehicles sharing year + kilometres + price: likely duplicate entries. */
export async function findDuplicateGroups() {
  const docs = await (await getDb()).collection("vehicles").find({ publication_status: { $ne: "archived" }, odometer_km: { $ne: null } },
    { projection: { make: 1, model: 1, variant: 1, model_year: 1, price_inr: 1, odometer_km: 1, slug: 1, inventory_status: 1, publication_status: 1, images: { $slice: 1 } } }).toArray();
  const groups = new Map<string, Brief[]>();
  for (const d of docs) {
    const v = serialize<Brief & { odometer_km: number | null }>(d);
    const k = duplicateKey({ model_year: v.model_year, odometer_km: v.odometer_km, price_inr: v.price_inr });
    if (k) groups.set(k, [...(groups.get(k) ?? []), v]);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

