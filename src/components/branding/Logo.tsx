import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/lib/settings";

/** Uploaded logo at its natural proportions, or a plain text wordmark until one is uploaded. */
export function Logo({ settings, height = 40 }: { settings: SiteSettings; height?: number }) {
  const { logo } = settings;
  return (
    <Link href="/" aria-label={`${settings.brandName} — home`} className="flex items-center">
      {logo ? (
        <Image
          src={logo.header}
          alt={settings.brandName}
          width={Math.round((logo.headerWidth / logo.headerHeight) * height)}
          height={height}
          style={{ height, width: "auto" }}
          priority
          unoptimized
        />
      ) : (
        <span className="display text-xl tracking-tight">{settings.brandName}</span>
      )}
    </Link>
  );
}
