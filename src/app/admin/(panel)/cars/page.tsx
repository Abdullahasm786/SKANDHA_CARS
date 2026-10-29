import { AlertTriangle, Plus, SearchX } from "lucide-react";
import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { PaginationControls } from "@/components/admin/Pagination";
import { VehicleFilters } from "@/components/admin/VehicleFilters";
import { VehicleList, type SortHrefs } from "@/components/admin/VehicleList";
import { requireAdmin } from "@/lib/auth/require-admin";
import { type AdminSort, findDuplicateGroups, listAdminVehicles, SORTS } from "@/lib/db/admin-repo";
import { vehicleTitle } from "@/lib/utils/format";

export const metadata = { title: "All vehicles" };
type SP = Promise<Record<string, string | undefined>>;
const num = (v?: string) => { const n = Number(v); return v && Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined; };

export default async function AdminCars({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, num(sp.page) ?? 1);
  const sort = (sp.sort && sp.sort in SORTS ? sp.sort : "updated") as AdminSort;
  const dir = sp.dir === "asc" ? "asc" : "desc";
  const view = sp.view === "grid" ? "grid" : "table";
  const ok = (s?: string, list: string[] = []) => (s && list.includes(s) ? s : undefined);

  let data, dupes;
  let failed = false;
  try {
    [data, dupes] = await Promise.all([
      listAdminVehicles({ q: sp.q, status: ok(sp.status, ["available", "reserved", "sold"]), pub: ok(sp.pub, ["draft", "published", "archived"]), make: sp.make,
        minYear: num(sp.minYear), maxYear: num(sp.maxYear), minPrice: num(sp.minPrice), maxPrice: num(sp.maxPrice), sort, dir, page, pageSize: num(sp.size) }),
      findDuplicateGroups(),
    ]);
  } catch { failed = true; }

  const build = (patch: Record<string, string | undefined>) => {
    const n = new URLSearchParams(Object.entries({ ...sp, ...patch }).filter(([, v]) => v) as [string, string][]);
    return `/admin/cars${n.size ? `?${n}` : ""}`;
  };
  const sortHrefs: SortHrefs = Object.fromEntries((["year", "price", "km", "updated"] as AdminSort[]).map((k) => {
    const cur = sort === k ? dir : null;
    return [k, { href: build({ sort: k, dir: cur === "desc" ? "asc" : "desc", page: undefined }), dir: cur }];
  }));
  const titleBy = sp.status === "sold" ? "Sold cars" : sp.status === "reserved" ? "Reserved cars" : sp.status === "available" ? "Available cars" : sp.pub === "draft" ? "Drafts" : "All vehicles";

  if (failed || !data) {
    return (<><PageHeader title={titleBy} /><EmptyState Icon={AlertTriangle} title="Couldn't load vehicles" text="The database didn't respond. Check your connection and try again." action={<Link href="/admin/cars" className="btn btn-primary btn-sm">Retry</Link>} /></>);
  }
  const pages = Math.max(1, Math.ceil(data.count / data.pageSize));
  const filtered = Object.keys(sp).some((k) => !["page", "view", "size", "sort", "dir"].includes(k));

  return (
    <div>
      <PageHeader title={titleBy} description={`${data.count} ${data.count === 1 ? "vehicle" : "vehicles"}`}
        actions={<Link href="/admin/cars/new" className="btn btn-primary"><Plus size={16} aria-hidden /> Add vehicle</Link>} />
      {dupes && dupes.length > 0 && (
        <details className="card mb-4 border-warn/40 p-4">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><AlertTriangle size={16} className="text-warn" aria-hidden /> {dupes.length} possible duplicate {dupes.length === 1 ? "entry" : "entries"} to review</summary>
          <p className="mt-2 text-sm text-muted">These cars share the same year, kilometres and price. Nothing is merged or deleted automatically — open each one and archive or delete the extra if it is a duplicate.</p>
          <ul className="mt-3 grid gap-3">{dupes.map((g, i) => (
            <li key={i} className="rounded-lg bg-surface-2 p-3 text-sm"><ul className="grid gap-1">{g.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-2"><Link className="font-medium underline" href={`/admin/cars/${v.id}`}>{vehicleTitle(v)}</Link><span className="text-xs text-muted">{v.inventory_status} · {v.publication_status}</span>
                <Link className="text-xs text-accent-ink hover:underline" href={`/admin/cars/${v.id}/edit`}>Edit</Link></li>))}</ul></li>))}</ul>
        </details>
      )}
      <VehicleFilters makes={data.makes} view={view} />
      {data.rows.length === 0 ? (
        filtered ? <EmptyState Icon={SearchX} title="No vehicles match these filters" text="Try removing a filter or searching for something else." action={<Link href="/admin/cars" className="btn btn-sm">Clear filters</Link>} />
          : <EmptyState title="No vehicles yet" text="Add your first car to start building your inventory." action={<Link href="/admin/cars/new" className="btn btn-primary btn-sm">Add vehicle</Link>} />
      ) : (
        <>
          <VehicleList rows={data.rows} view={view} sortHrefs={sortHrefs} />
          <PaginationControls page={page} pages={pages} total={data.count} size={data.pageSize} href={(p) => build({ page: String(p) })} />
        </>
      )}
    </div>
  );
}
