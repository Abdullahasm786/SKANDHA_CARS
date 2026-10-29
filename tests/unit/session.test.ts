import { beforeAll, describe, expect, it } from "vitest";
import { signSession, verifySession } from "@/lib/auth/session";

beforeAll(() => { process.env.AUTH_SECRET = "x".repeat(40); });

describe("admin session token", () => {
  it("round-trips", async () => {
    const t = await signSession("abc", "a@b.co");
    expect(await verifySession(t)).toEqual({ id: "abc", email: "a@b.co" });
  });
  it("rejects tampered, foreign-secret and empty tokens", async () => {
    const t = await signSession("abc", "a@b.co");
    expect(await verifySession(t.slice(0, -2) + "xx")).toBeNull();
    process.env.AUTH_SECRET = "y".repeat(40);
    expect(await verifySession(t)).toBeNull();
    expect(await verifySession(undefined)).toBeNull();
    process.env.AUTH_SECRET = "x".repeat(40);
  });
});
