import type { Vehicle } from "@/lib/types";

export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatKm(value: number): string {
  return `${new Intl.NumberFormat("en-IN").format(value)} km`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(iso));
}

export function vehicleTitle(v: Pick<Vehicle, "model_year" | "make" | "model" | "variant">): string {
  return [v.model_year, v.make, v.model, v.variant].filter(Boolean).join(" ");
}

const LABELS: Record<string, string> = {
  cng: "CNG", lpg: "LPG", suv: "SUV", muv: "MUV", amt: "AMT",
};
export function label(value: string | null | undefined): string {
  if (!value) return "";
  return LABELS[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Indian short price: ₹10.77 lakh / ₹1.2 crore / ₹85,000. */
export function formatLakh(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2).replace(/\.?0+$/, "")} crore`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(2).replace(/\.?0+$/, "")} lakh`;
  return formatINR(value);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));
}
