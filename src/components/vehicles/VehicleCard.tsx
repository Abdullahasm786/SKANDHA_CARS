import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { WhatsappButton } from "@/components/ui/WhatsappButton";
import { vehicleImageUrl } from "@/lib/storage/urls";
import type { VehicleWithRelations } from "@/lib/types";
import { formatINR, formatKm, formatLakh, label, vehicleTitle } from "@/lib/utils/format";
import { primaryImage } from "@/lib/vehicles/queries";
import { normalizeWhatsapp, vehicleMessage } from "@/lib/whatsapp";

const ORDINAL = ["", "1st", "2nd", "3rd"];

export function VehicleCard({ v, waNumber, priority = false, tag }: { v: VehicleWithRelations; waNumber: string | null; priority?: boolean; tag?: string }) {
  const img = primaryImage(v);
  const title = vehicleTitle(v);
  const number = normalizeWhatsapp(waNumber);
  const message = vehicleMessage(v);
  const chips = [
    v.odometer_km != null && formatKm(v.odometer_km),
    label(v.fuel_type), label(v.transmission),
    v.ownership_count && `${ORDINAL[v.ownership_count] ?? `${v.ownership_count}th`} owner`,
  ].filter(Boolean) as string[];
  const place = [v.registration_city, v.registration_state].filter(Boolean).join(", ");
  const badge = v.inventory_status !== "available" ? label(v.inventory_status) : tag;

  return (
    <article className="group flex flex-col overflow-hidden rounded-[28px] bg-surface shadow-[0_8px_30px_-16px_rgb(0_0_0/.25)] transition-shadow duration-300 hover:shadow-[0_22px_44px_-20px_rgb(0_0_0/.4)]">
      <Link href={`/cars/${v.slug}`} className="block" aria-label={`${title}, ${formatINR(v.price_inr)}`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-b from-surface-2 to-surface">
          {img ? (
            <Image src={vehicleImageUrl(img.storage_path)} alt={img.alt_text || title} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105" priority={priority} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-medium text-muted">Photo coming soon</div>
          )}
          {badge && (
            <span className={`absolute bottom-0 left-0 rounded-tr-3xl px-4 py-2 text-sm font-bold ${v.inventory_status === "sold" ? "bg-danger-bg text-danger" : v.inventory_status === "reserved" ? "bg-warn-bg text-warn" : "bg-surface text-fg"}`}>
              {badge}
            </span>
          )}
        </div>
        <div className="px-5 pt-4">
          <h3 className="text-xl font-bold leading-snug tracking-tight">
            {v.model_year} {v.make} {v.model}
            {v.variant && <span className="ml-1.5 text-sm font-medium uppercase text-muted">{v.variant}</span>}
          </h3>
          {chips.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${title} highlights`}>
              {chips.map((c) => <li key={c} className="rounded-lg bg-surface-2 px-3 py-1.5 text-sm text-muted">{c}</li>)}
            </ul>
          )}
          <p className="mt-4 pb-4 text-[1.7rem] font-extrabold tracking-tight">
            {formatLakh(v.price_inr)}
            {v.negotiable && <span className="ml-2 align-middle text-xs font-semibold text-muted">Negotiable</span>}
          </p>
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between gap-3 bg-surface-2 px-5 py-3">
        <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
          {place && <><MapPin size={15} aria-hidden className="shrink-0" /><span className="truncate">{place}</span></>}
        </p>
        {message && number && <WhatsappButton number={number} message={message} label="WhatsApp" size="sm" className="shrink-0" />}
      </div>
    </article>
  );
}
