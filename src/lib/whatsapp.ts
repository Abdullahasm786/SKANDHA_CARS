import type { Vehicle } from "@/lib/types";
import { formatINR, vehicleTitle } from "@/lib/utils/format";

/**
 * Normalises a phone number to digits with country code (no "+"), e.g. "+91 98765 43210" -> "919876543210".
 * A bare 10-digit number is assumed to be Indian (+91). Returns null if invalid.
 */
export function normalizeWhatsapp(input: string | null | undefined, defaultCountry = "91"): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, "");
  if (input.trim().startsWith("00")) digits = digits.replace(/^00/, "");
  else if (!input.trim().startsWith("+") && digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = defaultCountry + digits;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function whatsappUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

type VehicleForMessage = Pick<Vehicle, "model_year" | "make" | "model" | "variant" | "price_inr" | "inventory_status">;

/** Returns null for sold vehicles: no enquiry about availability should be offered. */
export function vehicleMessage(v: VehicleForMessage): string | null {
  const title = vehicleTitle(v);
  const price = formatINR(v.price_inr);
  if (v.inventory_status === "sold") return null;
  if (v.inventory_status === "reserved") {
    return `Hi Skandha Cars, I saw the ${title} listed at ${price} is marked as reserved. Could you let me know if it becomes available again?`;
  }
  return `Hi Skandha Cars, I'm interested in the ${title}, listed at ${price}. Is this vehicle currently available?`;
}

export const GENERAL_MESSAGE = "Hi Skandha Cars, I'd like to know more about the cars you have available.";
