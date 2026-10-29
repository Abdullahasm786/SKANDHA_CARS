export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

export function isDbConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}
export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}
