import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatusControls } from "@/components/admin/StatusControls";
import { requireAdmin } from "@/lib/auth/require-admin";
import { vehicleImageUrl } from "@/lib/storage/urls";
import { formatDate, formatINR, vehicleTitle } from "@/lib/utils/format";
import { primaryImage } from "@/lib/vehicles/queries";
import { ADMIN_PAGE, listAdminVehicles } from "@/lib/db/admin-repo";

export const metadata = { title: "Inventory" };
type SP = Promise<{ q?: string; status?: string; pub?: string; page?: string }>;

export default async function AdminCars({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  await requireAdmin();
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, count } = await listAdminVehicles({ q: sp.q, status: sp.status, pub: sp.pub, page });
  const pages = Math.max(1, Math.ceil(count / ADMIN_PAGE));
  const qs = (p: number) => { const s = new URLSearchParams(Object.entries({ ...sp, page: String(p) }).filter(([, v]) => v) as [string, string][]); return `?${s}`; };

  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="display text-4xl">Inventory</h1><Link className="btn btn-primary" href="/admin/cars/new">Add car</Link></div>
      <form className="mt-5 grid gap-3 sm:grid-cols-4" role="search">
        <input name="q" defaultValue={sp.q} placeholder="Search make, model…" aria-label="Search" className="field sm:col-span-2" />
        <select name="status" defaultValue={sp.status ?? ""} aria-label="Inventory status" className="field"><option value="">Any status</option><option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option></select>
        <select name="pub" defaultValue={sp.pub ?? ""} aria-label="Publication" className="field"><option value="">Not archived</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
        <button className="btn sm:col-span-4 sm:w-fit">Filter</button>
      </form>
      <p className="mt-4 text-sm text-muted">{count} vehicles</p>
      {rows.length === 0 ? <p className="mt-4 border border-dashed border-line p-8 text-muted">No vehicles match. <Link className="underline" href="/admin/cars/new">Add your first car</Link>.</p> : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <caption className="sr-only">Vehicles</caption>
            <thead className="border-b border-line text-xs uppercase tracking-wider text-muted"><tr>
              <th className="py-2 pr-3" scope="col">Car</th><th scope="col">Price</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col">Actions</th></tr></thead>
            <tbody className="divide-y divide-line">{rows.map((v) => {
              const img = primaryImage(v);
              return (
                <tr key={v.id} className="align-top">
                  <td className="flex items-center gap-3 py-3 pr-3">
                    <div className="relative h-14 w-20 shrink-0 bg-surface-2">{img && <Image src={vehicleImageUrl(img.storage_path, "thumb")} alt="" fill sizes="80px" className="object-cover" />}</div>
                    <span className="font-semibold">{vehicleTitle(v)}{v.is_featured && <span className="ml-2 text-xs text-accent-ink">★ featured</span>}</span></td>
                  <td>{formatINR(v.price_inr)}</td>
                  <td><div className="flex flex-col items-start gap-1"><StatusBadge status={v.inventory_status} /><StatusBadge status={v.publication_status} /></div></td>
                  <td>{formatDate(v.updated_at)}</td>
                  <td className="space-y-2">
                    <div className="flex gap-1.5"><Link className="btn btn-sm" href={`/admin/cars/${v.id}/edit`}>Edit</Link>
                      {v.publication_status === "published" ? <Link className="btn btn-sm" href={`/cars/${v.slug}`} target="_blank">View</Link> : null}</div>
                    <StatusControls id={v.id} title={vehicleTitle(v)} inventory={v.inventory_status} publication={v.publication_status} />
                  </td>
                </tr>);
            })}</tbody>
          </table>
        </div>)}
      {pages > 1 && <nav className="mt-6 flex items-center gap-3" aria-label="Pagination">
        {page > 1 && <Link className="btn btn-sm" href={qs(page - 1)}>Previous</Link>}<span className="text-sm text-muted">Page {page} of {pages}</span>
        {page < pages && <Link className="btn btn-sm" href={qs(page + 1)}>Next</Link>}</nav>}
    </div>
  );
}
