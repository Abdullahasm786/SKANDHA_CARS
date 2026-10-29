import type { Filter } from "mongodb";
import { escapeRegex, safe, serialize } from "@/lib/db/mongo";
import type { VehicleWithRelations } from "@/lib/types";
import { PAGE_SIZE, type CarFilters } from "./filters";

type Doc = Record<string, unknown>;

const PUBLIC_AVAILABLE = { publication_status: "published", inventory_status: "available" } as const;

export function primaryImage(v: Pick<VehicleWithRelations, "images">) {
  return v.images.find((i) => i.is_primary) ?? v.images[0] ?? null;
}

/** Kept for API compatibility: removes characters that matter in patterns; the regex is escaped again at use. */
export function safeSearchTerm(q: string): string {
  return q.replace(/[,()%*\\_]/g, " ").replace(/\s+/g, " ").trim();
}

function hydrate(docs: Doc[]): VehicleWithRelations[] {
  return docs.map((d) => {
    const v = serialize<VehicleWithRelations>(d);
    v.images = [...(v.images ?? [])].sort((a, b) => a.display_order - b.display_order);
    return v;
  });
}

export async function searchVehicles(f: CarFilters): Promise<{ items: VehicleWithRelations[]; total: number; error?: boolean }> {
  if (!process.env.MONGODB_URI) return { items: [], total: 0 };
  const result = await safe(async (db) => {
    const q: Filter<Doc> = { ...PUBLIC_AVAILABLE, inventory_status: f.status === "sold" ? "sold" : "available" };
    const ci = (v: string) => new RegExp(`^${escapeRegex(v)}$`, "i");
    if (f.make) q.make = ci(f.make);
    if (f.model) q.model = ci(f.model);
    if (f.fuel) q.fuel_type = f.fuel;
    if (f.transmission) q.transmission = f.transmission;
    if (f.body) q.body_type = f.body;
    const range = (min?: number, max?: number) => ({ ...(min !== undefined && { $gte: min }), ...(max !== undefined && { $lte: max }) });
    if (f.minPrice !== undefined || f.maxPrice !== undefined) q.price_inr = range(f.minPrice, f.maxPrice);
    if (f.minYear !== undefined || f.maxYear !== undefined) q.model_year = range(f.minYear, f.maxYear);
    if (f.maxKm !== undefined) q.odometer_km = { $lte: f.maxKm };
    if (f.q) {
      const term = safeSearchTerm(f.q);
      if (term) { const r = new RegExp(escapeRegex(term), "i"); q.$or = [{ make: r }, { model: r }, { variant: r }]; }
    }
    const sort = ({ price_asc: { price_inr: 1 }, price_desc: { price_inr: -1 }, year_desc: { model_year: -1, published_at: -1 } } as const)[f.sort as "price_asc"] ?? { published_at: -1 };
    const col = db.collection<Doc>("vehicles");
    const [docs, total] = await Promise.all([
      col.find(q).sort(sort as never).skip((f.page - 1) * PAGE_SIZE).limit(PAGE_SIZE).toArray(),
      col.countDocuments(q),
    ]);
    return { items: hydrate(docs), total };
  }, null);
  return result ?? { items: [], total: 0, error: true };
}

export async function getVehicleBySlug(slug: string): Promise<VehicleWithRelations | null> {
  return safe(async (db) => {
    const d = await db.collection<Doc>("vehicles").findOne({ slug, publication_status: "published" });
    return d ? hydrate([d])[0] : null;
  }, null);
}

export async function getRedirectSlug(oldSlug: string): Promise<string | null> {
  return safe(async (db) => {
    const r = await db.collection<{ _id: string; vehicle_id: string }>("vehicle_slug_redirects").findOne({ _id: oldSlug });
    if (!r) return null;
    const v = await db.collection<{ _id: string; slug: string }>("vehicles").findOne({ _id: r.vehicle_id, publication_status: "published" } as never);
    return v?.slug ?? null;
  }, null);
}

async function list(filter: Filter<Doc>, limit: number): Promise<VehicleWithRelations[]> {
  return safe(async (db) => hydrate(await db.collection<Doc>("vehicles").find({ ...PUBLIC_AVAILABLE, ...filter }).sort({ published_at: -1 }).limit(limit).toArray()), []);
}
export const getFeatured = (limit = 6) => list({ is_featured: true }, limit);
export const getRecent = (limit = 6) => list({}, limit);
export const getAvailable = (limit = 48) => list({}, limit);

export async function getSold(limit = 48): Promise<VehicleWithRelations[]> {
  return safe(async (db) => hydrate(await db.collection<Doc>("vehicles").find({ publication_status: "published", inventory_status: "sold" }).sort({ published_at: -1 }).limit(limit).toArray()), []);
}

export async function getRelated(v: VehicleWithRelations, limit = 3) {
  const or: Filter<Doc>[] = [{ make: v.make }];
  if (v.body_type) or.push({ body_type: v.body_type });
  return list({ _id: { $ne: v.id } as never, $or: or }, limit);
}

export interface Facets { make: Array<{ value: string; n: number }>; body_type: Array<{ value: string; n: number }>;
  fuel_type: Array<{ value: string; n: number }>; transmission: Array<{ value: string; n: number }>;
  model: Array<{ value: string; make: string; model: string; n: number }>; }

export async function getFacets(): Promise<Facets> {
  const empty: Facets = { make: [], body_type: [], fuel_type: [], transmission: [], model: [] };
  return safe(async (db) => {
    const col = db.collection("vehicles");
    const group = async (field: string) =>
      (await col.aggregate<{ _id: string; n: number }>([{ $match: { ...PUBLIC_AVAILABLE, [field]: { $ne: null } } }, { $group: { _id: `$${field}`, n: { $sum: 1 } } }, { $sort: { _id: 1 } }]).toArray())
        .map((r) => ({ value: r._id, n: r.n }));
    const [make, body_type, fuel_type, transmission, models] = await Promise.all([
      group("make"), group("body_type"), group("fuel_type"), group("transmission"),
      col.aggregate<{ _id: { make: string; model: string }; n: number }>([{ $match: PUBLIC_AVAILABLE }, { $group: { _id: { make: "$make", model: "$model" }, n: { $sum: 1 } } }]).toArray(),
    ]);
    return { make, body_type, fuel_type, transmission, model: models.map((m) => ({ value: `${m._id.make}|${m._id.model}`, make: m._id.make, model: m._id.model, n: m.n })) };
  }, empty);
}

export async function getSitemapVehicles(): Promise<Array<{ slug: string; updated_at: string }>> {
  return safe(async (db) => (await db.collection("vehicles").find(PUBLIC_AVAILABLE, { projection: { slug: 1, updated_at: 1 } }).sort({ updated_at: -1 }).limit(5000).toArray())
    .map((d) => serialize<{ slug: string; updated_at: string }>(d)), []);
}
