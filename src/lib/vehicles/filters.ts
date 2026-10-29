export const PAGE_SIZE = 12;
export const SORTS = ["newest", "price_asc", "price_desc", "year_desc"] as const;
export type Sort = (typeof SORTS)[number];

export interface CarFilters {
  q?: string; status?: "sold"; make?: string; model?: string;
  minPrice?: number; maxPrice?: number; fuel?: string; transmission?: string; body?: string;
  minYear?: number; maxYear?: number; maxKm?: number; sort: Sort; page: number;
}

type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const text = (v: string | string[] | undefined) => {
  const s = first(v)?.trim().slice(0, 80);
  return s ? s : undefined;
};
const num = (v: string | string[] | undefined) => {
  const s = first(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
};

export function parseFilters(p: Params): CarFilters {
  const sort = first(p.sort);
  return {
    q: text(p.q), status: first(p.status) === "sold" ? "sold" : undefined, make: text(p.make), model: text(p.model),
    minPrice: num(p.minPrice), maxPrice: num(p.maxPrice), fuel: text(p.fuel),
    transmission: text(p.transmission), body: text(p.body),
    minYear: num(p.minYear), maxYear: num(p.maxYear), maxKm: num(p.maxKm),
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as Sort) : "newest",
    page: Math.max(1, num(p.page) ?? 1),
  };
}

/** Serialises filters back into a query string (defaults omitted). */
export function filtersToQuery(f: Partial<CarFilters>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === "" || (k === "sort" && v === "newest") || (k === "page" && v === 1)) continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const FILTER_LABELS: Record<string, string> = {
  q: "Search", make: "Make", model: "Model", minPrice: "Min price", maxPrice: "Max price",
  fuel: "Fuel", transmission: "Transmission", body: "Body", minYear: "From year", maxYear: "To year", maxKm: "Max km",
};
