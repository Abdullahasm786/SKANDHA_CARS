import { z } from "zod";
import { emptyToUndef, optText } from "./common";
import { normalizeWhatsapp } from "@/lib/whatsapp";

export const settingsSchema = z.object({
  brand_name: z.string().trim().min(1).max(60).default("Skandha Cars"),
  whatsapp: z.preprocess(
    (v) => (typeof v === "string" && v.trim() ? v : undefined),
    z.string().refine((s) => normalizeWhatsapp(s) !== null, "Enter a valid number, e.g. +91 98xxxxxxxx").transform((s) => normalizeWhatsapp(s)!).optional(),
  ),
  accent_colour: z.preprocess(emptyToUndef, z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #b45309").optional()),
  seo_title: optText(120),
  seo_description: optText(320),
  announcement: optText(200),
  about: optText(6000),
  business_description: optText(600),
  default_publication: z.preprocess(emptyToUndef, z.enum(["draft", "published"]).optional()),
  privacy: optText(20000),
  terms: optText(20000),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
