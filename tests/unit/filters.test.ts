import { describe, expect, it } from "vitest";
import { filtersToQuery, parseFilters } from "@/lib/vehicles/filters";
import { safeSearchTerm } from "@/lib/vehicles/queries";

describe("filters", () => {
  it("parses and sanitises query params", () => {
    const f = parseFilters({ make: "Honda", minPrice: "100000", maxKm: "-5", sort: "bogus", page: "0" });
    expect(f).toMatchObject({ make: "Honda", minPrice: 100000, maxKm: undefined, sort: "newest", page: 1 });
  });
  it("round-trips through the URL, omitting defaults", () => {
    expect(filtersToQuery(parseFilters({ make: "Honda", sort: "price_asc", page: "2" }))).toBe("?make=Honda&sort=price_asc&page=2");
    expect(filtersToQuery(parseFilters({}))).toBe("");
  });
  it("strips PostgREST filter metacharacters from search terms", () => {
    expect(safeSearchTerm("a,b)(c%d*")).toBe("a b c d");
  });
});
