"use server";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { cookieOptions, SESSION_COOKIE, signSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/mongo";
import { isDbConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/security/rate-limit";
import type { ActionState } from "@/lib/validation/common";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) });
// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function login(_prev: ActionState, fd: FormData): Promise<ActionState> {
  if (!isDbConfigured() || !process.env.AUTH_SECRET) return { message: "Server is not configured (MONGODB_URI / AUTH_SECRET). See the README." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`login:${ip}`, 8, 15 * 60_000)) return { message: "Too many attempts. Please wait a few minutes and try again." };
  const parsed = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { message: "Enter a valid email and password." };

  const admin = await (await getDb()).collection<{ _id: string; email: string; password_hash: string }>("admins").findOne({ email: parsed.data.email });
  const ok = await bcrypt.compare(parsed.data.password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !ok) return { message: "Invalid email or password." };

  (await cookies()).set(SESSION_COOKIE, await signSession(admin._id, admin.email), cookieOptions());
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
