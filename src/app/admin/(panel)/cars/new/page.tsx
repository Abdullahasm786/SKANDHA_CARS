import { VehicleForm } from "@/components/admin/VehicleForm";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata = { title: "Add car" };

export default async function NewCar() {
  await requireAdmin();
  return (
    <div><h1 className="display text-4xl">Add a car</h1>
      <div className="mt-6"><VehicleForm /></div></div>
  );
}
