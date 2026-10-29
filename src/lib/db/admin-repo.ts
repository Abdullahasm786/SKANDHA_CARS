import { escapeRegex, getDb, serialize } from "@/lib/db/mongo";
import type { Vehicle, VehicleImage, VehicleWithRelations } from "@/lib/types";

export const ADMIN_PAGE = 20;

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

export async function listAdminVehicles(sp: { q?: string; status?: string; pub?: string; page: number }) {
  const db = await getDb();
  const q: Record<string, unknown> = {};
  if (sp.q) { const r = new RegExp(escapeRegex(sp.q.trim().slice(0, 80)), "i"); q.$or = [{ make: r }, { model: r }, { variant: r }]; }
  if (sp.status) q.inventory_status = sp.status;
  if (sp.pub) q.publication_status = sp.pub; else q.publication_status = { $ne: "archived" };
  const col = db.collection("vehicles");
  const [docs, count] = await Promise.all([
    col.find(q).sort({ updated_at: -1 }).skip((sp.page - 1) * ADMIN_PAGE).limit(ADMIN_PAGE).toArray(),
    col.countDocuments(q),
  ]);
  const rows = docs.map((d) => {
    const v = serialize<VehicleWithRelations>(d);
    v.images = [...(v.images ?? [])].sort((a, b) => a.display_order - b.display_order);
    return v;
  });
  return { rows, count };
}

export async function dashboardData() {
  const col = (await getDb()).collection("vehicles");
  const [available, reserved, sold, drafts, featured, added, updated] = await Promise.all([
    col.countDocuments({ publication_status: "published", inventory_status: "available" }),
    col.countDocuments({ publication_status: "published", inventory_status: "reserved" }),
    col.countDocuments({ inventory_status: "sold", publication_status: { $ne: "archived" } }),
    col.countDocuments({ publication_status: "draft" }),
    col.countDocuments({ is_featured: true, publication_status: "published" }),
    col.find({}, { projection: { make: 1, model: 1, variant: 1, model_year: 1, created_at: 1, inventory_status: 1 } }).sort({ created_at: -1 }).limit(5).toArray(),
    col.find({}, { projection: { make: 1, model: 1, variant: 1, model_year: 1, updated_at: 1, inventory_status: 1 } }).sort({ updated_at: -1 }).limit(5).toArray(),
  ]);
  return {
    stats: { available, reserved, sold, drafts, featured },
    added: serialize<Array<Record<string, unknown>>>(added), updated: serialize<Array<Record<string, unknown>>>(updated),
  };
}
