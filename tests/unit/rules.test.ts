import { describe, expect, it } from "vitest";
import { canTransition, duplicateKey, featureBlockers, publishBlockers } from "@/lib/vehicles/rules";

describe("status transitions", () => {
  it("allows the normal inventory lifecycle", () => {
    expect(canTransition("inventory", "available", "reserved")).toBe(true);
    expect(canTransition("inventory", "reserved", "sold")).toBe(true);
    expect(canTransition("inventory", "sold", "available")).toBe(true);
  });
  it("rejects invalid or no-op transitions", () => {
    expect(canTransition("inventory", "sold", "reserved")).toBe(false);
    expect(canTransition("inventory", "available", "available")).toBe(false);
    expect(canTransition("publication", "archived", "published")).toBe(false);
    expect(canTransition("publication", "draft", "sold")).toBe(false);
  });
  it("sends archived listings back through draft", () => {
    expect(canTransition("publication", "archived", "draft")).toBe(true);
    expect(canTransition("publication", "draft", "published")).toBe(true);
  });
});

describe("publish and feature eligibility", () => {
  it("blocks publishing without photos or price", () => {
    expect(publishBlockers({ price_inr: 100, images: [] })).toEqual(["Add at least one photo"]);
    expect(publishBlockers({ price_inr: 0, images: [{}] })).toEqual(["Set an asking price"]);
    expect(publishBlockers({ price_inr: 100, images: [{}] })).toEqual([]);
  });
  it("only features published, available cars with photos", () => {
    const ok = { price_inr: 1, images: [{}], publication_status: "published", inventory_status: "available" };
    expect(featureBlockers(ok)).toEqual([]);
    expect(featureBlockers({ ...ok, inventory_status: "sold" })).toHaveLength(1);
    expect(featureBlockers({ ...ok, publication_status: "draft", images: [] })).toHaveLength(2);
  });
});

describe("duplicate detection", () => {
  it("keys on year, kilometres and price", () => {
    expect(duplicateKey({ model_year: 2011, odometer_km: 86000, price_inr: 225000 })).toBe("2011|86000|225000");
    expect(duplicateKey({ model_year: 2011, odometer_km: null, price_inr: 1 })).toBeNull();
  });
});
