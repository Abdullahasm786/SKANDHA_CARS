import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/mongo";
import { isDbConfigured } from "@/lib/env";
import { SESSION_COOKIE, verifySession } from "./session";

export interface AdminUser { id: string; email: string }

/** Verifies the signed cookie AND that the admin record still exists (so removing an admin revokes access immediately). */
export async function getAdminOrNull(): Promise<AdminUser | null> {
  if (!isDbConfigured() || !process.env.AUTH_SECRET) return null;
  const s = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!s) return null;
  const admin = await (await getDb()).collection<{ _id: string; email: string }>("admins").findOne({ _id: s.id });
  return admin ? { id: admin._id, email: admin.email } : null;
}

/** For admin pages: redirects to login when not authorised. Server actions use getAdminOrNull. */
export async function requireAdmin(): Promise<{ user: AdminUser }> {
  const user = await getAdminOrNull();
  if (!user) redirect("/admin/login");
  return { user };
}
