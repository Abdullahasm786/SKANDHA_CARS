"use server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getAdminOrNull } from "@/lib/auth/require-admin";
import { getDb } from "@/lib/db/mongo";
import { isCloudinaryConfigured } from "@/lib/env";
import { deleteImages, uploadBuffer } from "@/lib/storage/cloudinary";
import { processVehicleImage, UploadError } from "@/lib/storage/process";
import type { VehicleImage } from "@/lib/types";
import { refreshPublic } from "./common";

type R = { ok: boolean; message?: string };
const uuid = z.string().uuid();
type Img = Omit<VehicleImage, "vehicle_id" | "created_at"> & { created_at: Date };
type VDoc = { _id: string; images: Img[] };

async function vehicles() { return (await getDb()).collection<VDoc>("vehicles"); }

async function store(vehicleId: string, file: File): Promise<string> {
  if (!isCloudinaryConfigured()) throw new UploadError("Image storage (Cloudinary) is not configured.");
  const { large } = await processVehicleImage(Buffer.from(await file.arrayBuffer()));
  return uploadBuffer(large, `skandha-cars/vehicles/${vehicleId}/${randomUUID()}`);
}

async function guard(vehicleId?: string) {
  if (!(await getAdminOrNull())) return "You are not authorized.";
  if (vehicleId && !uuid.safeParse(vehicleId).success) return "Invalid vehicle.";
  return null;
}

export async function uploadVehicleImage(vehicleId: string, fd: FormData): Promise<R> {
  const denied = await guard(vehicleId);
  if (denied) return { ok: false, message: denied };
  const file = fd.get("file");
  if (!(file instanceof File)) return { ok: false, message: "No file received." };
  try {
    const col = await vehicles();
    const v = await col.findOne({ _id: vehicleId }, { projection: { images: 1 } });
    if (!v) return { ok: false, message: "Vehicle not found." };
    const path = await store(vehicleId, file);
    const imgs = v.images ?? [];
    const img: Img = { id: randomUUID(), storage_path: path, alt_text: null, display_order: imgs.reduce((m, i) => Math.max(m, i.display_order), -1) + 1, is_primary: imgs.length === 0, created_at: new Date() };
    await col.updateOne({ _id: vehicleId }, { $push: { images: img }, $set: { updated_at: new Date() } } as never);
    refreshPublic();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Upload failed. Please retry." };
  }
}

export async function replaceVehicleImage(vehicleId: string, imageId: string, fd: FormData): Promise<R> {
  const denied = await guard(vehicleId);
  if (denied) return { ok: false, message: denied };
  const file = fd.get("file");
  const col = await vehicles();
  const old = (await col.findOne({ _id: vehicleId }))?.images?.find((i) => i.id === imageId);
  if (!old || !(file instanceof File)) return { ok: false, message: "Image not found." };
  try {
    const path = await store(vehicleId, file);
    await col.updateOne({ _id: vehicleId, "images.id": imageId }, { $set: { "images.$.storage_path": path, updated_at: new Date() } } as never);
    await deleteImages([old.storage_path]);
    refreshPublic();
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof UploadError ? e.message : "Upload failed. Please retry." };
  }
}

export async function deleteVehicleImage(vehicleId: string, imageId: string): Promise<R> {
  const denied = await guard(vehicleId);
  if (denied) return { ok: false, message: denied };
  const col = await vehicles();
  const v = await col.findOne({ _id: vehicleId });
  const img = v?.images?.find((i) => i.id === imageId);
  if (!v || !img) return { ok: false, message: "Image not found." };
  const rest = v.images.filter((i) => i.id !== imageId).sort((a, b) => a.display_order - b.display_order);
  if (img.is_primary && rest[0]) rest[0].is_primary = true;
  await col.updateOne({ _id: vehicleId }, { $set: { images: rest, updated_at: new Date() } } as never);
  await deleteImages([img.storage_path]);
  refreshPublic();
  return { ok: true };
}

export async function setPrimaryImage(vehicleId: string, imageId: string): Promise<R> {
  const denied = await guard(vehicleId);
  if (denied) return { ok: false, message: denied };
  const col = await vehicles();
  const v = await col.findOne({ _id: vehicleId });
  if (!v?.images?.some((i) => i.id === imageId)) return { ok: false, message: "Image not found." };
  await col.updateOne({ _id: vehicleId }, { $set: { images: v.images.map((i) => ({ ...i, is_primary: i.id === imageId })), updated_at: new Date() } } as never);
  refreshPublic();
  return { ok: true };
}

export async function updateImageAlt(vehicleId: string, imageId: string, alt: string): Promise<R> {
  const denied = await guard(vehicleId);
  if (denied) return { ok: false, message: denied };
  await (await vehicles()).updateOne({ _id: vehicleId, "images.id": imageId }, { $set: { "images.$.alt_text": alt.trim().slice(0, 200) || null } } as never);
  refreshPublic();
  return { ok: true };
}

export async function reorderImages(vehicleId: string, orderedIds: string[]): Promise<R> {
  const denied = await guard(vehicleId);
  if (denied) return { ok: false, message: denied };
  if (!z.array(uuid).max(60).safeParse(orderedIds).success) return { ok: false, message: "Invalid order." };
  const col = await vehicles();
  const v = await col.findOne({ _id: vehicleId });
  if (!v) return { ok: false, message: "Vehicle not found." };
  const pos = new Map(orderedIds.map((id, i) => [id, i]));
  const images = v.images.map((i) => ({ ...i, display_order: pos.get(i.id) ?? i.display_order }));
  await col.updateOne({ _id: vehicleId }, { $set: { images, updated_at: new Date() } } as never);
  refreshPublic();
  return { ok: true };
}
