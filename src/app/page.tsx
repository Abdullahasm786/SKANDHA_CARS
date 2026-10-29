import { ArrowDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsappButton } from "@/components/ui/WhatsappButton";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { organizationJsonLd, pageMetadata, websiteJsonLd } from "@/lib/seo/site";
import { getSiteSettings } from "@/lib/settings";
import { vehicleImageUrl } from "@/lib/storage/urls";
import { formatINR } from "@/lib/utils/format";
import { getAvailable, getSold, primaryImage } from "@/lib/vehicles/queries";
import { GENERAL_MESSAGE, normalizeWhatsapp } from "@/lib/whatsapp";

export const revalidate = 300;

export async function generateMetadata() {
  const s = await getSiteSettings();
  return pageMetadata(s, { title: s.seoTitle ?? `${s.brandName} — Pre-owned cars`, description: s.seoDescription ?? "Explore pre-owned cars, compare the details, and connect directly with Skandha Cars.", path: "/" });
}

export default async function Home() {
  const [settings, available, sold] = await Promise.all([getSiteSettings(), getAvailable(48), getSold(48)]);
  const wa = normalizeWhatsapp(settings.whatsapp);
  const lead = (available.filter((v) => v.is_featured).length ? available.filter((v) => v.is_featured) : available);
  const collage = lead.slice(0, 3).map((v) => ({ v, img: primaryImage(v) })).filter((c) => c.img);

  return (
    <main>
      <JsonLd data={[organizationJsonLd(settings), websiteJsonLd(settings)]} />

      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-10 pt-8 sm:px-8 lg:grid-cols-12 lg:pt-14">
        <div className="lg:col-span-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-muted"><span className="h-2 w-2 rounded-full bg-accent" aria-hidden />Pre-owned cars · {settings.brandName}</p>
          <h1 className="display mt-5 text-[clamp(2.4rem,5.6vw,4.6rem)]">
            Find your next car.<br /><span className="accent-text">Make your next move.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">Explore pre-owned cars, compare the details, and connect directly with Skandha Cars.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#available" className="btn btn-primary">See available cars <ArrowDown size={16} aria-hidden /></a>
            <WhatsappButton number={wa} message={GENERAL_MESSAGE} />
          </div>
        </div>

        <div className="lg:col-span-6">
          {collage.length ? (
            <div className="grid grid-cols-6 gap-3">
              {collage.map(({ v, img }, i) => (
                <Link key={v.id} href={`/cars/${v.slug}`}
                  className={`group relative block overflow-hidden rounded-3xl bg-surface-2 ${i === 0 ? "col-span-6 aspect-[16/10]" : "col-span-3 aspect-[4/3]"}`}>
                  <Image src={vehicleImageUrl(img!.storage_path)} alt={img!.alt_text || `${v.make} ${v.model}`} fill priority={i === 0}
                    sizes={i === 0 ? "(min-width:1024px) 45vw, 100vw" : "(min-width:1024px) 22vw, 50vw"} className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-bg/90 px-3 py-1 text-sm font-semibold backdrop-blur">{v.make} {v.model} · {formatINR(v.price_inr)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[32px] bg-surface-2 p-8 text-center">
              <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-accent/30" aria-hidden />
              <div className="absolute -bottom-16 -left-10 h-64 w-64 rounded-full bg-accent/15" aria-hidden />
              <p className="relative max-w-xs text-sm text-muted">Placeholder — photos of your listed cars appear here once you add vehicles in the admin dashboard.</p>
            </div>
          )}
        </div>
      </section>

      <Block id="available" n="01" title="Available cars">
        {available.length ? (
          <Grid>{available.map((v, i) => <VehicleCard key={v.id} v={v} waNumber={settings.whatsapp} priority={i < 3} tag={i < 3 ? "New arrival" : undefined} />)}</Grid>
        ) : (
          <p className="rounded-2xl border border-dashed border-line-strong p-10 text-muted">No cars are listed right now. Check back soon{wa ? ", or message us on WhatsApp to ask what's coming" : ""}.</p>
        )}
      </Block>

      {sold.length > 0 && (
        <Block id="sold" n="02" title="Sold cars">
          <Grid>{sold.map((v) => <VehicleCard key={v.id} v={v} waNumber={settings.whatsapp} />)}</Grid>
        </Block>
      )}

      <Block n={sold.length ? "03" : "02"} title="How it works">
        <ol className="grid gap-6 md:grid-cols-3">
          {[["Browse", "Look through the available cars and open any car for full details and photos."],
            ["Ask", "Message Skandha Cars on WhatsApp about a specific car. We confirm availability when you ask."],
            ["View & decide", "Arrange a viewing and review the car and its documents before you decide."]].map(([t, d], i) => (
            <li key={t} className="card p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-base font-extrabold text-accent-fg" aria-hidden>{i + 1}</span>
              <h3 className="display mt-4 text-2xl">{t}</h3><p className="mt-2 text-muted">{d}</p></li>
          ))}
        </ol>
      </Block>

      <section className="mx-auto mt-6 max-w-7xl px-4 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[28px] bg-accent p-8 text-accent-fg sm:p-12 lg:flex-row lg:items-center">
          <h2 className="display text-[clamp(1.8rem,4vw,3rem)]">Found one you like?<br />Ask us on WhatsApp.</h2>
          <WhatsappButton number={wa} message={GENERAL_MESSAGE} className="shrink-0" />
        </div>
      </section>
    </main>
  );
}

function Block({ id, n, title, children }: { id?: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section id={id} className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 sm:px-8">
        <div className="mb-7"><p className="idx">{n}</p><h2 className="display mt-1 text-3xl sm:text-4xl">{title}</h2></div>
        {children}
      </section>
    </Reveal>
  );
}
const Grid = ({ children }: { children: React.ReactNode }) => <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
