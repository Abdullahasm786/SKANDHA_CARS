import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 300;

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSiteSettings();
  const icons: MetadataRoute.Manifest["icons"] = s.logo
    ? [
        { src: s.logo.icon192, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: s.logo.icon512, sizes: "512x512", type: "image/png", purpose: "any" },
        { src: s.logo.icon512, sizes: "512x512", type: "image/png", purpose: "maskable" },
      ]
    : [
        // Temporary text-only placeholder icons until the owner uploads the logo.
        { src: "/icon-192", sizes: "192x192", type: "image/png" },
        { src: "/icon-512", sizes: "512x512", type: "image/png" },
      ];
  return {
    name: s.brandName,
    short_name: s.brandName,
    description: s.seoDescription ?? "Pre-owned cars from Skandha Cars.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f6f2",
    theme_color: "#f7f6f2",
    categories: ["automotive", "shopping"],
    icons,
  };
}
