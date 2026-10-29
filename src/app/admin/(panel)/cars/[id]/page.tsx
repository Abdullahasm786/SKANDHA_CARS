import { AlertCircle, ExternalLink, Pencil, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, VehicleStatusBadge } from "@/components/admin/ui";
import { VehicleActions } from "@/components/admin/VehicleActions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getHistory, getVehicleById } from "@/lib/db/admin-repo";
import { vehicleImageUrl } from "@/lib/storage/urls";
import { formatDate, formatDateTime, formatINR, formatKm, label, vehicleTitle } from "@/lib/utils/format";
import { featureBlockers, publishBlockers } from "@/lib/vehicles/rules";

export const metadata = { title: "Vehicle details" };

export default async function VehicleDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [v, history] = await Promise.all([getVehicleById(id), getHistory(id)]);
  if (!v) notFound();
  const title = vehicleTitle(v);
  const issues = v.publication_status === "published" ? [] : publishBlockers(v);
  const featIssues = v.is_featured ? featureBlockers(v) : [];
  const specs: Array<[string, string | null]> = [
    ["Make", v.make], ["Model", v.model], ["Variant", v.variant], ["Year", String(v.model_year)], ["Colour", v.colour],
    ["Odometer", v.odometer_km != null ? formatKm(v.odometer_km) : null], ["Fuel", label(v.fuel_type) || null], ["Transmission", label(v.transmission) || null],
    ["Body type", label(v.body_type) || null], ["Owners", v.ownership_count ? String(v.ownership_count) : null],
    ["Registered in", [v.registration_city, v.registration_state].filter(Boolean).join(", ") || null],
    ["Insurance valid until", v.insurance_expiry ? formatDate(v.insurance_expiry) : null], ["Negotiable", v.negotiable == null ? null : v.negotiable ? "Yes" : "No"],
  ];
  return (
    <div>
      <PageHeader title={title} description={<span className="inline-flex flex-wrap items-center gap-2"><VehicleStatusBadge status={v.inventory_status} /><VehicleStatusBadge status={v.publication_status} />{v.is_featured && <span className="inline-flex items-center gap-1 text-xs font-semibold text-warn"><Star size={12} className="fill-warn" aria-hidden /> Featured</span>}</span>}
        actions={<>
          <Link href={`/admin/cars/${v.id}/edit`} className="btn btn-primary"><Pencil size={16} aria-hidden /> Edit</Link>
          {v.publication_status === "published" && <Link href={`/cars/${v.slug}`} target="_blank" className="btn"><ExternalLink size={16} aria-hidden /> View on website</Link>}
          <VehicleActions compact afterDelete="/admin/cars" v={{ id: v.id, title, slug: v.slug, inventory: v.inventory_status, publication: v.publication_status, featured: v.is_featured }} />
        </>} />
      {(issues.length > 0 || featIssues.length > 0) && (
        <div role="note" className="mb-5 flex gap-3 rounded-xl border border-warn/30 bg-warn-bg p-3 text-sm text-warn"><AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
          <div>{issues.length > 0 && <p><strong>Can&apos;t be published yet:</strong> {issues.join("; ")}.</p>}{featIssues.length > 0 && <p><strong>Not shown as featured:</strong> {featIssues.join("; ")}.</p>}</div></div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          <section className="card p-4" aria-label="Photos">
            {v.images.length === 0 ? <p className="grid h-48 place-items-center text-sm text-muted">No photos yet. <Link className="text-accent-ink underline" href={`/admin/cars/${v.id}/edit`}>Add photos</Link></p> : (
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">{v.images.map((im, i) => (
                <li key={im.id} className={`relative overflow-hidden rounded-lg bg-surface-2 ${i === 0 ? "col-span-2 row-span-2 aspect-[4/3] sm:col-span-2" : "aspect-[4/3]"}`}>
                  <Image src={vehicleImageUrl(im.storage_path)} alt={im.alt_text || `${title} photo ${i + 1}`} fill sizes="(min-width:1024px) 40vw, 50vw" className="object-cover" />
                  {im.is_primary && <span className="absolute left-2 top-2 rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-fg">Cover</span>}</li>))}</ul>)}
          </section>
          <section className="card p-5"><h2 className="text-base font-semibold">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{v.description || <span className="text-muted">No description.</span>}</p>
            {v.features.length > 0 && <><h3 className="mt-5 text-sm font-semibold">Features</h3><ul className="mt-2 grid list-disc gap-1 pl-5 text-sm sm:grid-cols-2">{v.features.map((f) => <li key={f}>{f}</li>)}</ul></>}
          </section>
        </div>
        <div className="grid content-start gap-6">
          <section className="card p-5"><p className="text-2xl font-bold">{formatINR(v.price_inr)}</p>
            <dl className="mt-4 divide-y divide-line text-sm">{specs.map(([k, val]) => <div key={k} className="flex justify-between gap-4 py-2"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{val ?? <span className="text-muted" aria-label="Not provided">—</span>}</dd></div>)}</dl></section>
          <section className="card p-5"><h2 className="text-base font-semibold">Timeline</h2>
            <dl className="mt-3 grid gap-1.5 text-sm"><div className="flex justify-between"><dt className="text-muted">Created</dt><dd>{formatDateTime(v.created_at)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Last updated</dt><dd>{formatDateTime(v.updated_at)}</dd></div>
              {v.published_at && <div className="flex justify-between"><dt className="text-muted">Published</dt><dd>{formatDateTime(v.published_at)}</dd></div>}
              {v.sold_at && <div className="flex justify-between"><dt className="text-muted">Marked sold</dt><dd>{formatDateTime(v.sold_at)}</dd></div>}</dl>
            <h3 className="mt-4 text-sm font-semibold">Status history</h3>
            <ul className="mt-2 grid gap-1.5 text-sm">{history.length === 0 ? <li className="text-muted">No history.</li> : history.map((h) => <li key={h.id} className="text-muted">{formatDateTime(h.changed_at)} — {h.kind}: {h.previous_status ?? "—"} → <strong className="text-fg">{h.new_status}</strong>{h.reason ? ` (${h.reason})` : ""}</li>)}</ul></section>
        </div>
      </div>
    </div>
  );
}
