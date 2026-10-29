import { notFound } from "next/navigation";
import { ImageManager } from "@/components/admin/ImageManager";
import { VehicleForm } from "@/components/admin/VehicleForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getVehicleById } from "@/lib/db/admin-repo";
import { vehicleTitle } from "@/lib/utils/format";

export const metadata = { title: "Edit vehicle" };

export default async function EditCar({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const v = await getVehicleById(id);
  if (!v) notFound();
  return (
    <>
      <PageHeader title={`Edit ${vehicleTitle(v)}`} description="Changes go live on the website as soon as they are saved." />
      <div className="grid gap-5 pb-24">
        <VehicleForm vehicle={v} />
        <div className="card p-5 sm:p-6"><ImageManager vehicleId={v.id} images={v.images} title={vehicleTitle(v)} /></div>
      </div>
    </>
  );
}
