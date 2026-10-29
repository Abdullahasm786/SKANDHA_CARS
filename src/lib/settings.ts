import { safe } from "@/lib/db/mongo";
import { cloudUrl } from "@/lib/storage/urls";

export interface LogoSet {
  header: string; headerWidth: number; headerHeight: number;
  icon192: string; icon512: string; favicon: string; apple: string; og: string;
}

export interface SiteSettings {
  brandName: string;
  whatsapp: string | null;
  accentColour: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  announcement: string | null;
  about: string | null;
  businessDescription: string | null;
  defaultPublication: "draft" | "published";
  privacy: string | null;
  terms: string | null;
  logo: LogoSet | null;
}

export const EMPTY_SETTINGS: SiteSettings = {
  brandName: "Skandha Cars", whatsapp: null,
  accentColour: null, seoTitle: null, seoDescription: null,
  announcement: null, about: null, businessDescription: null, defaultPublication: "draft", privacy: null, terms: null, logo: null,
};

type Raw = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : null);

export function mapSettings(rows: Array<{ key: string; value: unknown }>): SiteSettings {
  const raw: Raw = {};
  for (const r of rows) raw[r.key] = r.value;
  const logoRaw = raw.logo as Record<string, unknown> | undefined;
  const logo: LogoSet | null =
    logoRaw && typeof logoRaw.header === "string"
      ? {
          header: cloudUrl(logoRaw.header as string),
          headerWidth: Number(logoRaw.headerWidth) || 240,
          headerHeight: Number(logoRaw.headerHeight) || 80,
          icon192: cloudUrl(logoRaw.icon192 as string),
          icon512: cloudUrl(logoRaw.icon512 as string),
          favicon: cloudUrl(logoRaw.favicon as string),
          apple: cloudUrl(logoRaw.apple as string),
          og: cloudUrl(logoRaw.og as string),
        }
      : null;
  return {
    brandName: str(raw.brand_name) ?? "Skandha Cars",
    whatsapp: str(raw.whatsapp),
    accentColour: str(raw.accent_colour),
    seoTitle: str(raw.seo_title),
    seoDescription: str(raw.seo_description),
    announcement: str(raw.announcement),
    about: str(raw.about),
    businessDescription: str(raw.business_description),
    defaultPublication: raw.default_publication === "published" ? "published" : "draft",
    privacy: str(raw.privacy),
    terms: str(raw.terms),
    logo,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await safe(
    async (db) => (await db.collection<{ _id: string; value: unknown }>("site_settings").find().toArray()).map((r) => ({ key: r._id, value: r.value })),
    null,
  );
  return rows ? mapSettings(rows) : EMPTY_SETTINGS;
}

/** Settings still needing owner input, for the admin checklist. */
export function missingSettings(s: SiteSettings): string[] {
  const out: string[] = [];
  if (!s.logo) out.push("Upload the original logo");
  if (!s.whatsapp) out.push("Business WhatsApp number");
  if (!s.seoDescription) out.push("Default SEO description");
  if (!s.about) out.push("About page content");
  if (!s.privacy) out.push("Privacy policy content");
  if (!s.terms) out.push("Terms content");
  return out;
}
