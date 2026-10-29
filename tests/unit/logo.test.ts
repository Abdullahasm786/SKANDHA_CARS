import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { processLogo, processVehicleImage, UploadError } from "@/lib/storage/process";

describe("image processing", () => {
  it("keeps the logo's proportions and outputs square icons", async () => {
    const wide = await sharp({ create: { width: 600, height: 150, channels: 4, background: "#c00" } }).png().toBuffer();
    const v = await processLogo(wide);
    expect(v.headerWidth / v.headerHeight).toBeCloseTo(4, 1);
    const icon = await sharp(v.icon512).metadata();
    expect([icon.width, icon.height]).toEqual([512, 512]);
    const og = await sharp(v.og).metadata();
    expect([og.width, og.height]).toEqual([1200, 630]);
  });
  it("rasterises SVG and drops script content", async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50"><script>alert(1)</script><rect width="200" height="50" fill="#123"/></svg>');
    const v = await processLogo(svg);
    expect((await sharp(v.header).metadata()).format).toBe("png");
  });
  it("rejects non-images regardless of name or MIME", async () => {
    await expect(processVehicleImage(Buffer.from("MZ not an image"))).rejects.toBeInstanceOf(UploadError);
    await expect(processVehicleImage(Buffer.alloc(0))).rejects.toBeInstanceOf(UploadError);
  });
  it("re-encodes vehicle photos to webp and strips EXIF", async () => {
    const jpg = await sharp({ create: { width: 1200, height: 800, channels: 3, background: "#456" } }).jpeg().withExif({ IFD0: { Copyright: "x" } }).toBuffer();
    const { large } = await processVehicleImage(jpg);
    const m = await sharp(large).metadata();
    expect(m.format).toBe("webp"); expect(m.exif).toBeUndefined();
  });
});
