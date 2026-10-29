import { AlertCircle, ExternalLink, Star } from "lucide-react";
import Link from "next/link";
import { FeatureButton } from "@/components/admin/FeatureButton";
import { EmptyState, PageHeader, VehicleStatusBadge } from "@/components/admin/ui";
import { VehicleThumb } from "@/components/admin/VehicleThumb";
import { requireAdmin } from "@/lib/auth/require-admin";
import { featuredOverview } from "@/lib/db/admin-repo";
import { formatINR, vehicleTitle } from "@/lib/utils/format";
import { featureBlockers } from "@/lib/vehicles/rules";

export const metadata = { title: "Featured vehicles" };

export default async function FeaturedPage() {
  await requireAdmin();
  const { featured, candidates } = await featuredOverview();
  return (
    <div>
      <PageHeader title="Featured vehicles" description="Featured cars are highlighted on the website homepage. Only published, available cars with a photo are shown." />
      <section aria-labelledby="cur">
        <h2 id="cur" className="mb-3 text-base font-semibold">Currently featured ({featured.length})</h2>
        {featured.length === 0 ? <EmptyState Icon={Star} title="No featured vehicles" text="Pick cars from the list below to highlight them on the homepage." /> : (
          <ul className="grid gap-3">{featured.map((v) => {
            const issues = featureBlockers(v);
            return (
              <li key={v.id} className="card flex flex-wrap items-center gap-3 p-3">
                <VehicleThumb images={v.images} className="!h-14 !w-20" />
                <div className="min-w-0 flex-1"><Link href={`/admin/cars/${v.id}`} className="block truncate font-semibold hover:underline">{vehicleTitle(v)}</Link>
                  <p className="text-sm text-muted">{formatINR(v.price_inr)}</p>
                  {issues.length > 0 && <p className="mt-1 flex items-center gap-1.5 text-xs text-warn"><AlertCircle size={13} aria-hidden /> Not shown on website: {issues.join("; ")}</p>}</div>
                <div className="flex flex-wrap items-center gap-2"><VehicleStatusBadge status={v.inventory_status} /><VehicleStatusBadge status={v.publication_status} />
                  {v.publication_status === "published" && <Link href={`/cars/${v.slug}`} target="_blank" className="btn btn-sm"><ExternalLink size={14} aria-hidden /> Preview</Link>}
                  <FeatureButton id={v.id} featured title={vehicleTitle(v)} /></div>
              </li>);
          })}</ul>)}
      </section>
      <section aria-labelledby="cand" className="mt-8">
        <h2 id="cand" className="mb-3 text-base font-semibold">Eligible to feature</h2>
        {candidates.length === 0 ? <p className="text-sm text-muted">No other published, available cars.</p> : (
          <ul className="grid gap-3 sm:grid-cols-2">{candidates.map((v) => (
            <li key={v.id} className="card flex items-center gap-3 p-3"><VehicleThumb images={v.images} />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{vehicleTitle(v)}</p><p className="text-xs text-muted">{formatINR(v.price_inr)}</p></div>
              <FeatureButton id={v.id} featured={false} title={vehicleTitle(v)} /></li>))}</ul>)}
      </section>
    </div>
  );
}
