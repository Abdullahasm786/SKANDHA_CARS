import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Gallery } from "@/components/gallery/Gallery";
import { JsonLd } from "@/components/seo/JsonLd";
import { ShareButton } from "@/components/vehicles/ShareButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { WhatsappButton } from "@/components/ui/WhatsappButton";
import { abs, breadcrumbJsonLd, pageMetadata } from "@/lib/seo/site";
import { getSiteSettings } from "@/lib/settings";
import { vehicleImageUrl } from "@/lib/storage/urls";
import { formatDate, formatINR, formatKm, label, vehicleTitle } from "@/lib/utils/format";
import { getRedirectSlug, getRelated, getVehicleBySlug, primaryImage } from "@/lib/vehicles/queries";
import { normalizeWhatsapp, vehicleMessage } from "@/lib/whatsapp";

export const revalidate = 300;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [v, s] = await Promise.all([getVehicleBySlug(slug), getSiteSettings()]);
  if (!v) return { title: "Car not found", robots: { index: false } };
  const title = v.seo_title ?? `${vehicleTitle(v)} for sale`;
  const specs = [v.odometer_km != null && formatKm(v.odometer_km), label(v.fuel_type), label(v.transmission)].filter(Boolean).join(", ");
  const description = v.seo_description ?? `${vehicleTitle(v)} — ${formatINR(v.price_inr)}${specs ? `, ${specs}` : ""}.`;
  const img = primaryImage(v);
  return pageMetadata(s, {
    title, description, path: `/cars/${v.slug}`,
    image: img ? vehicleImageUrl(img.storage_path) : null,
    noindex: v.inventory_status === "sold", // sold cars stay reachable but out of search results
  });
}

export default async function VehiclePage({ params }: Props) {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) {
    const target = await getRedirectSlug(slug);
    if (target) permanentRedirect(`/cars/${target}`);
    notFound();
  }
  const [settings, related] = await Promise.all([getSiteSettings(), getRelated(v)]);
  const title = vehicleTitle(v);
  const message = vehicleMessage(v);
  const number = normalizeWhatsapp(settings.whatsapp);
  const images = v.images.map((i) => ({ src: vehicleImageUrl(i.storage_path), thumb: vehicleImageUrl(i.storage_path, "thumb"), alt: i.alt_text || title }));
  const sold = v.inventory_status === "sold";

  const specRows: Array<[string, string | null]> = [
    ["Make", v.make], ["Model", v.model], ["Variant", v.variant],
    ["Model year", String(v.model_year)], ["Manufactured", v.manufacturing_year ? String(v.manufacturing_year) : null],
    ["Kilometres driven", v.odometer_km != null ? formatKm(v.odometer_km) : null],
    ["Fuel", label(v.fuel_type) || null], ["Transmission", label(v.transmission) || null],
    ["Body type", label(v.body_type) || null], ["Colour", v.colour],
    ["Owners", v.ownership_count ? String(v.ownership_count) : null],
    ["Registered in", [v.registration_city, v.registration_state].filter(Boolean).join(", ") || null],
    ["Insurance valid until", v.insurance_expiry ? formatDate(v.insurance_expiry) : null],
  ];

  const ld = {
    "@context": "https://schema.org", "@type": "Car", name: title, brand: { "@type": "Brand", name: v.make },
    model: v.model, vehicleModelDate: String(v.model_year),
    ...(v.variant ? { vehicleConfiguration: v.variant } : {}),
    ...(v.odometer_km != null ? { mileageFromOdometer: { "@type": "QuantitativeValue", value: v.odometer_km, unitCode: "KMT" } } : {}),
    ...(v.fuel_type ? { fuelType: label(v.fuel_type) } : {}), ...(v.colour ? { color: v.colour } : {}),
    ...(v.description ? { description: v.description } : {}),
    image: images.map((i) => i.src), url: abs(`/cars/${v.slug}`),
    ...(!sold ? { offers: { "@type": "Offer", price: v.price_inr, priceCurrency: "INR", availability: v.inventory_status === "available" ? "https://schema.org/InStock" : "https://schema.org/LimitedAvailability", url: abs(`/cars/${v.slug}`) } } : {}),
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-28 sm:px-8 lg:pb-8">
      <JsonLd data={[ld, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Cars", path: "/" }, { name: title, path: `/cars/${v.slug}` }])]} />
      <nav aria-label="Breadcrumb" className="eyebrow">
        <Link href="/">Home</Link> / <Link href="/#available">Cars</Link> / <span aria-current="page">{title}</span>
      </nav>
      <div className="mt-6 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7"><Gallery images={images} title={title} /></div>
        <div className="lg:col-span-5">
          <StatusBadge status={v.inventory_status} />
          <p className="eyebrow mt-4">{v.make}</p>
          <h1 className="display mt-1 text-3xl sm:text-5xl">{v.model_year} {v.model}{v.variant ? <span className="font-semibold text-muted"> {v.variant}</span> : null}</h1>
          <p className="display mt-4 text-4xl">{formatINR(v.price_inr)}</p>
          {v.negotiable != null && <p className="text-sm text-muted">{v.negotiable ? "Price is negotiable" : "Fixed price"}</p>}

          {sold ? (
            <p className="mt-6 rounded-2xl bg-danger-bg p-4 text-danger">This car has been sold. <Link className="underline" href="/#available">See available cars</Link>.</p>
          ) : (
            <div className="mt-6 hidden flex-wrap gap-3 lg:flex">
              {message && <WhatsappButton number={number} message={message} label={v.inventory_status === "reserved" ? "Ask about this reserved car" : "Enquire on WhatsApp"} />}
              <ShareButton title={title} />
            </div>
          )}
          {!sold && !number && (
            <p className="mt-4 text-sm text-muted">WhatsApp enquiries are being set up. Please check back soon.</p>
          )}
          {v.inventory_status === "reserved" && <p className="mt-3 text-sm text-muted">This car is currently reserved. It may become available again.</p>}
          <p className="mt-4 text-sm text-muted">Opening WhatsApp starts a chat with a prefilled message; availability is confirmed by Skandha Cars once you send it. To arrange a viewing, mention your preferred time in the chat.</p>
        </div>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-labelledby="desc">
          <h2 id="desc" className="display pb-2 text-2xl">About this car</h2>
          {v.description ? <p className="mt-3 whitespace-pre-line leading-relaxed">{v.description}</p> : <p className="mt-3 text-muted">No description provided yet.</p>}
          {v.features.length > 0 && (<>
            <h3 className="mt-8 font-semibold">Features</h3>
            <ul className="mt-2 grid list-disc gap-1 pl-5 sm:grid-cols-2">{v.features.map((f) => <li key={f}>{f}</li>)}</ul></>)}
          {v.service_history && <><h3 className="mt-8 font-semibold">Service history</h3><p className="mt-2 whitespace-pre-line">{v.service_history}</p></>}
          {v.inspection_notes && <><h3 className="mt-8 font-semibold">Inspection notes</h3><p className="mt-2 whitespace-pre-line">{v.inspection_notes}</p></>}
        </section>
        <section className="lg:col-span-5" aria-labelledby="specs">
          <h2 id="specs" className="display pb-2 text-2xl">Specifications</h2>
          <dl className="mt-3 divide-y divide-line rounded-2xl border border-line bg-surface px-4">
            {specRows.filter(([, val]) => val).map(([k, val]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{val}</dd></div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted">Last updated {formatDate(v.updated_at)}</p>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="rel">
          <h2 id="rel" className="display pb-2 text-3xl">More available cars</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <VehicleCard key={r.id} v={r} waNumber={settings.whatsapp} />)}</div>
        </section>
      )}

      {!sold && message && number && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-line bg-bg/95 p-3 backdrop-blur lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <WhatsappButton number={number} message={message} label="Enquire on WhatsApp" className="flex-1" />
        </div>
      )}
    </main>
  );
}

export function generateStaticParams() { return []; }
