import { revalidatePath } from "next/cache";

/** Public pages, sitemap and layout (settings) all derive from the database; refresh everything affected. */
export function refreshPublic() {
  revalidatePath("/", "layout");
  revalidatePath("/sitemap.xml");
  revalidatePath("/manifest.webmanifest");
}
