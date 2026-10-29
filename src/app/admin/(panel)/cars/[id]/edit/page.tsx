import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageManager } from "@/components/admin/ImageManager";
import { StatusControls } from "@/components/admin/StatusControls";
import { VehicleForm } from "@/components/admin/VehicleForm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getHistory, getVehicleById } from "@/lib/db/admin-repo";
import { formatDate, vehicleTitle } from "@/lib/utils/format";

export const metadata = { title: "Edit car" };

export default async function EditCar({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [v, history] = await Promise.all([getVehicleById(id), getHistory(id)]);
  if (!v) notFound();
  const images = v.images;
  const vehicle = v; const title = vehicleTitle(vehicle);
  return (
    <div>
      <p className="text-sm"><Link className="underline" href="/admin/cars">← Inventory</Link></p>
      <h1 className="display mt-2 text-4xl">{title}</h1>
      {sp.created && <p role="status" className="mt-3 bg-success-bg p-3 text-sm text-success">Car created. {vehicle.publication_status === "draft" ? "It is a draft — publish it when ready." : ""}</p>}
      <div className="mt-4"><StatusControls id={vehicle.id} title={title} inventory={vehicle.inventory_status} publication={vehicle.publication_status} /></div>
      <div className="mt-8"><VehicleForm vehicle={vehicle} /></div>
      <ImageManager vehicleId={vehicle.id} images={images} title={title} />
      <section className="mt-10" aria-labelledby="hist"><h2 id="hist" className="display text-2xl">Status history</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
          {history.map((h) => <li key={h.id} className="py-2">{formatDate(h.changed_at)} — {h.kind}: {h.previous_status ?? "—"} → <strong>{h.new_status}</strong>{h.reason ? ` (${h.reason})` : ""}</li>)}
        </ul></section>
    </div>
  );
}
