"use server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getAdminOrNull } from "@/lib/auth/require-admin";
import { getDb } from "@/lib/db/mongo";
import { rateLimit } from "@/lib/security/rate-limit";
import type { ActionState } from "@/lib/validation/common";

const schema = z.object({ current: z.string().min(1), next: z.string().min(12, "Use at least 12 characters").max(200), confirm: z.string() })
  .refine((v) => v.next === v.confirm, { message: "Passwords don't match", path: ["confirm"] });

export async function changePassword(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await getAdminOrNull();
  if (!admin) return { message: "You are not authorized." };
  if (!rateLimit(`pw:${admin.id}`, 5, 15 * 60_000)) return { message: "Too many attempts. Try again later." };
  const parsed = schema.safeParse({ current: fd.get("current"), next: fd.get("next"), confirm: fd.get("confirm") });
  if (!parsed.success) { const i = parsed.error.issues[0]; return { errors: { [String(i.path[0])]: i.message }, message: i.message }; }
  const col = (await getDb()).collection<{ _id: string; password_hash: string }>("admins");
  const me = await col.findOne({ _id: admin.id });
  if (!me || !(await bcrypt.compare(parsed.data.current, me.password_hash))) return { errors: { current: "Current password is incorrect" }, message: "Current password is incorrect" };
  await col.updateOne({ _id: admin.id }, { $set: { password_hash: await bcrypt.hash(parsed.data.next, 12), updated_at: new Date() } });
  return { ok: true, message: "Password updated." };
}
