import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session";

/** Gates /admin on a valid signed session. Pages and server actions re-check the admin record in the database. */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let valid = false;
  try { valid = Boolean(await verifySession(request.cookies.get(SESSION_COOKIE)?.value)); } catch { /* AUTH_SECRET missing */ }
  const res = !valid && pathname !== "/admin/login"
    ? NextResponse.redirect(new URL("/admin/login", request.url))
    : NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
