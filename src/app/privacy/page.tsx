import { PlainText } from "@/components/ui/PlainText";
import { pageMetadata } from "@/lib/seo/site";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 300;
export async function generateMetadata() {
  return pageMetadata(await getSiteSettings(), { title: "Privacy policy", path: "/privacy", description: "Privacy policy for Skandha Cars." });
}

export default async function Page() {
  const s = await getSiteSettings();
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="display text-4xl">Privacy policy</h1>
      <div className="mt-6">
        {s.privacy ? <PlainText text={s.privacy} /> : (
          <p className="border border-dashed border-line p-5 text-muted">This page has not been written yet. The owner can add the text in Admin → Settings (legal review recommended).</p>
        )}
      </div>
    </main>
  );
}
