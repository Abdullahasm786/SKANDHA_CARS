import { z } from "zod";
import { emptyToUndef, optInt, optText } from "./common";

export const FUEL_TYPES = ["petrol", "diesel", "cng", "lpg", "electric", "hybrid"] as const;
export const TRANSMISSIONS = ["manual", "automatic"] as const;
export const BODY_TYPES = ["hatchback", "sedan", "suv", "muv", "coupe", "convertible", "wagon", "pickup", "van"] as const;

const optEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(emptyToUndef, z.enum(values).optional());

export const vehicleSchema = z.object({
  make: z.string().trim().min(1, "Make is required").max(60),
  model: z.string().trim().min(1, "Model is required").max(80),
  variant: optText(80),
  model_year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  manufacturing_year: optInt(1950, 2100),
  price_inr: z.coerce.number().int().min(0, "Price must be 0 or more").max(1_000_000_000),
  negotiable: z.preprocess((v) => (v === "yes" ? true : v === "no" ? false : undefined), z.boolean().optional()),
  odometer_km: optInt(0, 2_000_000),
  fuel_type: optEnum(FUEL_TYPES),
  transmission: optEnum(TRANSMISSIONS),
  body_type: optEnum(BODY_TYPES),
  colour: optText(40),
  ownership_count: optInt(1, 20),
  registration_city: optText(80),
  registration_state: optText(80),
  description: optText(5000),
  features: z.preprocess(
    (v) =>
      typeof v === "string"
        ? v.split("\n").map((s) => s.trim()).filter(Boolean)
        : [],
    z.array(z.string().max(80)).max(60),
  ),
  service_history: optText(3000),
  inspection_notes: optText(3000),
  insurance_expiry: z.preprocess(emptyToUndef, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  inventory_status: z.enum(["available", "reserved", "sold"]),
  publication_status: z.enum(["draft", "published", "archived"]),
  is_featured: z.preprocess((v) => v === "on" || v === "true", z.boolean()),
  seo_title: optText(120),
  seo_description: optText(320),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

export const statusChangeSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["inventory", "publication"]),
  status: z.string(),
  reason: optText(300),
}).superRefine((v, ctx) => {
  const allowed = v.kind === "inventory" ? ["available", "reserved", "sold"] : ["draft", "published", "archived"];
  if (!allowed.includes(v.status)) ctx.addIssue({ code: "custom", message: "Invalid status", path: ["status"] });
});

/** Converts validated input to a DB row (undefined -> null so cleared fields are really cleared). */
export function toVehicleRow(input: VehicleInput) {
  const nul = <T,>(v: T | undefined) => (v === undefined ? null : v);
  return {
    make: input.make, model: input.model, variant: nul(input.variant),
    model_year: input.model_year, manufacturing_year: nul(input.manufacturing_year),
    price_inr: input.price_inr, negotiable: nul(input.negotiable),
    odometer_km: nul(input.odometer_km), fuel_type: nul(input.fuel_type),
    transmission: nul(input.transmission), body_type: nul(input.body_type),
    colour: nul(input.colour), ownership_count: nul(input.ownership_count),
    registration_city: nul(input.registration_city), registration_state: nul(input.registration_state),
    description: nul(input.description), features: input.features,
    service_history: nul(input.service_history), inspection_notes: nul(input.inspection_notes),
    insurance_expiry: nul(input.insurance_expiry), inventory_status: input.inventory_status,
    publication_status: input.publication_status, is_featured: input.is_featured,
    seo_title: nul(input.seo_title), seo_description: nul(input.seo_description),
  };
}
