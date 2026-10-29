import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 300;

/** Public website chrome. The admin area has its own shell and does not use this layout. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:bg-fg focus:p-3 focus:text-bg">Skip to content</a>
      <Header settings={settings} />
      <div id="main" tabIndex={-1}>{children}</div>
      <Footer settings={settings} />
    </>
  );
}
