import sharp from "sharp";
type Metadata = Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
type Color = string | { r: number; g: number; b: number; alpha?: number };

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const RASTER = new Set(["jpeg", "png", "webp"]);

export class UploadError extends Error {}

/** Decodes with sharp (ignores browser MIME type and filename) and rejects anything that is not a real image. */
async function inspect(buf: Buffer, allowSvg: boolean) {
  if (buf.length === 0) throw new UploadError("The file is empty.");
  if (buf.length > MAX_UPLOAD_BYTES) throw new UploadError("The file is larger than 8 MB.");
  let meta: Metadata;
  try {
    meta = await sharp(buf, { limitInputPixels: 80_000_000 }).metadata();
  } catch {
    throw new UploadError("That file isn't a valid image.");
  }
  const fmt = meta.format ?? "";
  if (!(RASTER.has(fmt) || (allowSvg && fmt === "svg"))) throw new UploadError("Only JPEG, PNG and WebP images are supported.");
  return meta;
}

export async function processVehicleImage(buf: Buffer) {
  const meta = await inspect(buf, false);
  if ((meta.width ?? 0) < 400 || (meta.height ?? 0) < 300) throw new UploadError("Image is too small (minimum 400×300).");
  // rotate() applies EXIF orientation; output re-encoding strips all metadata (including GPS).
  const base = () => sharp(buf, { limitInputPixels: 80_000_000 }).rotate();
  const large = await base().resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  return { large };
}

export interface LogoVariants {
  header: Buffer; headerWidth: number; headerHeight: number;
  icon192: Buffer; icon512: Buffer; favicon: Buffer; apple: Buffer; og: Buffer;
}

/**
 * Builds logo variants without ever stretching: every size uses fit "contain" on a canvas.
 * SVG uploads are rasterised (never stored or served as SVG), which removes any scripts/external references.
 */
export async function processLogo(buf: Buffer): Promise<LogoVariants> {
  const meta = await inspect(buf, true);
  const input = () => sharp(buf, { density: meta.format === "svg" ? 300 : undefined, limitInputPixels: 80_000_000 }).rotate();
  const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
  const header = await input().resize({ height: 200, width: 800, fit: "inside", withoutEnlargement: meta.format !== "svg" }).png().toBuffer({ resolveWithObject: true });
  const square = (size: number, pad: number, bg: Color) =>
    input().resize({ width: Math.round(size * pad), height: Math.round(size * pad), fit: "contain", background: transparent })
      .extend({ top: 0, bottom: 0, left: 0, right: 0 }).toBuffer()
      .then((inner) => sharp({ create: { width: size, height: size, channels: 4, background: bg } }).composite([{ input: inner, gravity: "centre" }]).png().toBuffer());
  const og = await input().resize({ width: 960, height: 400, fit: "contain", background: transparent }).toBuffer()
    .then((inner) => sharp({ create: { width: 1200, height: 630, channels: 4, background: "#f6f4ef" } }).composite([{ input: inner, gravity: "centre" }]).png().toBuffer());
  return {
    header: header.data, headerWidth: header.info.width, headerHeight: header.info.height,
    icon192: await square(192, 0.8, transparent),
    icon512: await square(512, 0.8, transparent),
    favicon: await square(64, 1, transparent),
    apple: await square(180, 0.78, "#ffffff"),
    og,
  };
}
