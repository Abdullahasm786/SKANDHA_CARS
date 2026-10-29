import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";
import { getSitemapVehicles } from "@/lib/vehicles/queries";

export const revalidate = 600;

/** Sold, draft, reserved and archived vehicles are intentionally excluded from the sitemap. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vehicles = await getSitemapVehicles();
  const staticPaths = ["", "/about", "/privacy", "/terms"];
  return [
    ...staticPaths.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.6 })),
    ...vehicles.map((v) => ({ url: `${siteUrl}/cars/${v.slug}`, lastModified: v.updated_at, priority: 0.8 })),
  ];
}
