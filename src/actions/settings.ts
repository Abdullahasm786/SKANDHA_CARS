"use server";
import { getAdminOrNull } from "@/lib/auth/require-admin";
import { getDb } from "@/lib/db/mongo";
import { isCloudinaryConfigured } from "@/lib/env";
import { deleteImages, uploadBuffer } from "@/lib/storage/cloudinary";
import { processLogo, UploadError } from "@/lib/storage/process";
import { fieldErrors, formToObject, type ActionState } from "@/lib/validation/common";
import { settingsSchema } from "@/lib/validation/settings";
import { refreshPublic } from "./common";

export async function saveSettings(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await getAdminOrNull();
  if (!admin) return { message: "You are not authorized." };
  const parsed = settingsSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Please fix the highlighted fields." };
  const col = (await getDb()).collection<{ _id: string; value: unknown }>("site_settings");
  const now = new Date();
  await col.bulkWrite(Object.entries(parsed.data).map(([key, value]) => ({
    updateOne: { filter: { _id: key }, update: { $set: { value: value ?? "", updated_by: admin.id, updated_at: now } }, upsert: true },
  })) as never);
  refreshPublic();
  return { ok: true, message: "Settings saved." };
}

export async function uploadLogo(fd: FormData): Promise<{ ok: boolean; message: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, message: "You are not authorized." };
  if (!isCloudinaryConfigured()) return { ok: false, message: "Image storage (Cloudinary) is not configured." };
  const file = fd.get("file");
  if (!(file instanceof File)) return { ok: false, message: "No file received." };
  try {
    const v = await processLogo(Buffer.from(await file.arrayBuffer()));
    const dir = `skandha-cars/brand/logo-${Date.now()}`;
    const put = (name: string, buf: Buffer) => uploadBuffer(buf, `${dir}/${name}`);
    const [header, icon192, icon512, favicon, apple, og] = await Promise.all([
      put("header", v.header), put("icon-192", v.icon192), put("icon-512", v.icon512), put("favicon", v.favicon), put("apple", v.apple), put("og", v.og),
    ]);
    const value = { header, headerWidth: v.headerWidth, headerHeight: v.headerHeight, icon192, icon512, favicon, apple, og };
    const col = (await getDb()).collection<{ _id: string; value: Record<string, unknown> }>("site_settings");
    const old = await col.findOne({ _id: "logo" });
    await col.updateOne({ _id: "logo" }, { $set: { value, updated_by: admin.id, updated_at: new Date() } }, { upsert: true });
    if (old?.value) await deleteImages(Object.values(old.value).filter((x): x is string => typeof x === "string"));
    refreshPublic();
    return { ok: true, message: "Logo updated." };
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Logo upload failed. Please retry." };
  }
}

export async function removeLogo(): Promise<{ ok: boolean; message: string }> {
  const admin = await getAdminOrNull();
  if (!admin) return { ok: false, message: "You are not authorized." };
  const col = (await getDb()).collection<{ _id: string; value: Record<string, unknown> }>("site_settings");
  const old = await col.findOne({ _id: "logo" });
  await col.deleteOne({ _id: "logo" });
  if (old?.value) await deleteImages(Object.values(old.value).filter((x): x is string => typeof x === "string"));
  refreshPublic();
  return { ok: true, message: "Logo removed. A text wordmark is shown until a new logo is uploaded." };
}
