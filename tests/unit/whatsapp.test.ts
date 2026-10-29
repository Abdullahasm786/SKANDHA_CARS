import { describe, expect, it } from "vitest";
import { normalizeWhatsapp, vehicleMessage, whatsappUrl } from "@/lib/whatsapp";

const car = { model_year: 2019, make: "Hyundai", model: "i20", variant: "Asta", price_inr: 650000, inventory_status: "available" as const };

describe("normalizeWhatsapp", () => {
  it("normalises formatted numbers", () => expect(normalizeWhatsapp("+91 98765 43210")).toBe("919876543210"));
  it("assumes India for bare 10-digit numbers", () => expect(normalizeWhatsapp("9876543210")).toBe("919876543210"));
  it("handles a leading trunk zero", () => expect(normalizeWhatsapp("09876543210")).toBe("919876543210"));
  it("rejects empty and invalid", () => { expect(normalizeWhatsapp("")).toBeNull(); expect(normalizeWhatsapp("123")).toBeNull(); expect(normalizeWhatsapp(null)).toBeNull(); });
});

describe("vehicleMessage / whatsappUrl", () => {
  it("builds the enquiry from real data and encodes it", () => {
    const m = vehicleMessage(car)!;
    expect(m).toContain("2019 Hyundai i20 Asta");
    expect(m).toContain("₹6,50,000");
    const url = whatsappUrl("919876543210", m);
    expect(url.startsWith("https://wa.me/919876543210?text=")).toBe(true);
    expect(url).not.toContain(" ");
    expect(decodeURIComponent(url.split("text=")[1])).toBe(m);
  });
  it("uses distinct wording for reserved and none for sold", () => {
    expect(vehicleMessage({ ...car, inventory_status: "reserved" })).toContain("reserved");
    expect(vehicleMessage({ ...car, inventory_status: "sold" })).toBeNull();
  });
});
