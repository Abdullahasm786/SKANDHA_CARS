import { PlainText } from "@/components/ui/PlainText";
import { pageMetadata } from "@/lib/seo/site";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 300;
export async function generateMetadata() {
  return pageMetadata(await getSiteSettings(), { title: "Terms of use", path: "/terms", description: "Terms of use for Skandha Cars." });
}

export default async function Page() {
  const s = await getSiteSettings();
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="display text-4xl">Terms of use</h1>
      <div className="mt-6">
        {s.terms ? <PlainText text={s.terms} /> : (
          <p className="border border-dashed border-line p-5 text-muted">This page has not been written yet. The owner can add the text in Admin → Settings (legal review recommended).</p>
        )}
      </div>
    </main>
  );
}
