import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "sc_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters");
  return new TextEncoder().encode(secret);
}

export async function signSession(adminId: string, email: string): Promise<string> {
  return new SignJWT({ email }).setProtectedHeader({ alg: "HS256" }).setSubject(adminId)
    .setIssuedAt().setExpirationTime(`${MAX_AGE}s`).sign(key());
}

export async function verifySession(token: string | undefined): Promise<{ id: string; email: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    return payload.sub ? { id: payload.sub, email: String(payload.email ?? "") } : null;
  } catch {
    return null;
  }
}

export const cookieOptions = () => ({
  httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE,
});
