import { cloudName } from "@/lib/env";

/** Cloudinary delivery URL for a stored public id, with optional on-the-fly transformation. */
export function cloudUrl(publicId: string, transform?: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform ? `${transform}/` : ""}${publicId}`;
}

export function vehicleImageUrl(publicId: string, size: "large" | "thumb" = "large"): string {
  if (publicId.startsWith("/")) return publicId; // image served from /public (no Cloudinary)
  return cloudUrl(publicId, size === "thumb" ? "f_auto,q_auto,c_fill,w_480,h_360" : "f_auto,q_auto,c_limit,w_1800");
}

export function portfolioImageUrl(publicId: string, size: "large" | "thumb" = "large"): string {
  return cloudUrl(publicId, size === "thumb" ? "f_auto,q_auto,c_fill,w_640,h_640" : "f_auto,q_auto,c_limit,w_1600");
}
export function videoUrl(publicId: string): string {
  return `https://res.cloudinary.com/${cloudName}/video/upload/q_auto,vc_auto/${publicId}.mp4`;
}
export function videoPoster(publicId: string): string {
  return `https://res.cloudinary.com/${cloudName}/video/upload/so_0,f_jpg,q_auto,c_fill,w_640,h_640/${publicId}.jpg`;
}
