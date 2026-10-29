import { describe, expect, it } from "vitest";
import { formToObject } from "@/lib/validation/common";
import { settingsSchema } from "@/lib/validation/settings";
import { statusChangeSchema, vehicleSchema } from "@/lib/validation/vehicle";
import { slugify, uniqueSlug } from "@/lib/utils/slug";

function fd(obj: Record<string, string>) { const f = new FormData(); Object.entries(obj).forEach(([k, v]) => f.set(k, v)); return f; }
const base = { make: "Maruti", model: "Swift", model_year: "2020", price_inr: "500000", inventory_status: "available", publication_status: "draft" };

describe("vehicleSchema", () => {
  it("accepts required fields only and leaves optionals empty", () => {
    const r = vehicleSchema.safeParse(formToObject(fd({ ...base, variant: "", odometer_km: "", fuel_type: "" })));
    expect(r.success).toBe(true);
    if (r.success) { expect(r.data.variant).toBeUndefined(); expect(r.data.features).toEqual([]); }
  });
  it("rejects invalid input", () => {
    expect(vehicleSchema.safeParse(formToObject(fd({ ...base, price_inr: "-1" }))).success).toBe(false);
    expect(vehicleSchema.safeParse(formToObject(fd({ ...base, make: "" }))).success).toBe(false);
    expect(vehicleSchema.safeParse(formToObject(fd({ ...base, fuel_type: "steam" }))).success).toBe(false);
    expect(vehicleSchema.safeParse(formToObject(fd({ ...base, model_year: "1800" }))).success).toBe(false);
  });
  it("splits features by line", () => {
    const r = vehicleSchema.parse(formToObject(fd({ ...base, features: "ABS\n\n Airbags " })));
    expect(r.features).toEqual(["ABS", "Airbags"]);
  });
});

describe("other schemas", () => {
  it("validates status transitions by kind", () => {
    const id = "3f2b8f0e-1b1c-4a8e-9a43-0d4f6a1c2b3d";
    expect(statusChangeSchema.safeParse({ id, kind: "inventory", status: "sold" }).success).toBe(true);
    expect(statusChangeSchema.safeParse({ id, kind: "inventory", status: "archived" }).success).toBe(false);
    expect(statusChangeSchema.safeParse({ id: "x", kind: "publication", status: "draft" }).success).toBe(false);
  });
  it("validates settings", () => {
    expect(settingsSchema.safeParse(formToObject(fd({ whatsapp: "abc" }))).success).toBe(false);
    expect(settingsSchema.safeParse(formToObject(fd({ accent_colour: "red" }))).success).toBe(false);
    expect(settingsSchema.safeParse(formToObject(fd({ accent_colour: "#aabbcc", whatsapp: "9876543210" }))).success).toBe(true);
  });
});

describe("slugs", () => {
  it("slugifies", () => expect(slugify("2019 Hyundai i20 — Asta (O)")).toBe("2019-hyundai-i20-asta-o"));
  it("makes slugs unique", async () => {
    const taken = new Set(["a-b", "a-b-2"]);
    expect(await uniqueSlug("A B", async (s) => taken.has(s))).toBe("a-b-3");
  });
});
