import { v2 as cloudinary } from "cloudinary";
import { cloudName } from "@/lib/env";

function configure() {
  cloudinary.config({ cloud_name: cloudName, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  return cloudinary;
}

export function uploadBuffer(buf: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    configure().uploader.upload_stream({ public_id: publicId, resource_type: "image", overwrite: false, invalidate: true }, (err, res) => {
      if (err || !res) reject(err ?? new Error("upload failed"));
      else resolve(res.public_id);
    }).end(buf);
  });
}

export async function deleteImages(publicIds: string[], resourceType: "image" | "video" = "image"): Promise<void> {
  if (publicIds.length === 0) return;
  await configure().api.delete_resources(publicIds, { invalidate: true, resource_type: resourceType }).catch(() => undefined);
}

export const VIDEO_FORMATS = "mp4,mov,webm";

/** Signs a direct browser→Cloudinary video upload so large files never pass through this server. */
export function signVideoUpload(publicId: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { public_id: publicId, timestamp, allowed_formats: VIDEO_FORMATS };
  const signature = configure().utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
  return { ...params, signature, apiKey: process.env.CLOUDINARY_API_KEY!, cloudName, url: `https://api.cloudinary.com/v1_1/${cloudName}/video/upload` };
}

export async function videoExists(publicId: string): Promise<boolean> {
  try { await configure().api.resource(publicId, { resource_type: "video" }); return true; } catch { return false; }
}
