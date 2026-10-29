import { VehicleForm } from "@/components/admin/VehicleForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSiteSettings } from "@/lib/settings";

export const metadata = { title: "Add vehicle" };

export default async function NewCar() {
  await requireAdmin();
  const s = await getSiteSettings();
  return (<><PageHeader title="Add vehicle" description="Fill in what you know. Only make, model, year and price are required." /><div className="pb-24"><VehicleForm defaultPublication={s.defaultPublication} /></div></>);
}
