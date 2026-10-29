import { History } from "lucide-react";
import Link from "next/link";
import { PaginationControls } from "@/components/admin/Pagination";
import { EmptyState, PageHeader, VehicleStatusBadge } from "@/components/admin/ui";
import { VehicleThumb } from "@/components/admin/VehicleThumb";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listActivity } from "@/lib/db/admin-repo";
import { formatDateTime, formatINR, vehicleTitle } from "@/lib/utils/format";

export const metadata = { title: "Inventory activity" };
const SIZE = 20;

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const { rows, count } = await listActivity(page, SIZE);
  return (
    <div>
      <PageHeader title="Inventory activity" description="Every status change is recorded here: who changed it, what it changed from and to, and when." />
      {rows.length === 0 ? <EmptyState Icon={History} title="No activity yet" text="Status changes and new listings appear here." /> : (
        <>
          <ul className="card divide-y divide-line">{rows.map((r) => (
            <li key={r.id}><Link href={r.vehicle ? `/admin/cars/${r.vehicle.id}` : "#"} className="flex items-center gap-3 p-3 hover:bg-surface-2/50">
              <VehicleThumb images={r.vehicle?.images} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{r.vehicle ? vehicleTitle(r.vehicle) : "Deleted vehicle"}</span>
                <span className="block text-xs text-muted">{r.previous_status ? `${r.kind === "inventory" ? "Inventory" : "Listing"}: ${r.previous_status} → ${r.new_status}` : `Created as ${r.new_status}`}{r.reason ? ` · ${r.reason}` : ""}{r.vehicle ? ` · ${formatINR(r.vehicle.price_inr)}` : ""}</span></span>
              <span className="text-right"><VehicleStatusBadge status={r.new_status} /><span className="mt-1 block text-[11px] text-muted">{formatDateTime(r.changed_at)}</span></span></Link></li>))}</ul>
          <PaginationControls page={page} pages={Math.max(1, Math.ceil(count / SIZE))} total={count} size={SIZE} href={(p) => `/admin/activity?page=${p}`} />
        </>)}
    </div>
  );
}
