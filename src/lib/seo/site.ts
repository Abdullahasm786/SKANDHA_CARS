import type { Metadata } from "next";
import { siteUrl } from "@/lib/env";
import type { SiteSettings } from "@/lib/settings";

export const abs = (path: string) => `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

export function pageMetadata(
  settings: SiteSettings,
  o: { title: string; description: string; path: string; image?: string | null; noindex?: boolean },
): Metadata {
  const image = o.image ?? settings.logo?.og ?? undefined;
  return {
    title: o.title,
    description: o.description,
    alternates: { canonical: abs(o.path) },
    robots: o.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      title: o.title, description: o.description, url: abs(o.path), siteName: settings.brandName,
      type: "website", locale: "en_IN", images: image ? [{ url: image }] : undefined,
    },
    twitter: { card: image ? "summary_large_image" : "summary", title: o.title, description: o.description, images: image ? [image] : undefined },
  };
}

export function organizationJsonLd(s: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: s.brandName,
    url: siteUrl,
    ...(s.logo ? { logo: s.logo.og, image: s.logo.og } : {}),
    sameAs: ["https://www.instagram.com/skandhacars/"],
  };
}

export const websiteJsonLd = (s: SiteSettings) => ({
  "@context": "https://schema.org", "@type": "WebSite", name: s.brandName, url: siteUrl,
});

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}
