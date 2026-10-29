import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PwaProvider } from "@/components/pwa/PwaProvider";
import { themeScript } from "@/components/theme/theme-script";
import { siteUrl } from "@/lib/env";
import { getSiteSettings } from "@/lib/settings";
import { readableOn } from "@/lib/utils/colour";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const title = s.seoTitle ?? `${s.brandName} — Pre-owned cars`;
  const description = s.seoDescription ?? "Explore pre-owned cars, compare the details, and connect directly with Skandha Cars.";
  return {
    metadataBase: new URL(siteUrl),
    title: { default: title, template: `%s | ${s.brandName}` },
    description,
    applicationName: s.brandName,
    appleWebApp: { capable: true, title: s.brandName, statusBarStyle: "default" },
    icons: s.logo ? { icon: s.logo.favicon, apple: s.logo.apple } : { icon: "/icon-192", apple: "/icon-192" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f7f6f2" }, { media: "(prefers-color-scheme: dark)", color: "#0e1013" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const accent = settings.accentColour;
  return (
    <html lang="en-IN" className={`${jakarta.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {accent && (
          <style>{`:root,:root[data-theme="dark"]{--accent:${accent};--accent-ink:${accent};--accent-fg:${readableOn(accent)}}`}</style>
        )}
      </head>
      <body className="min-h-dvh antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[70] focus:bg-fg focus:p-3 focus:text-bg">Skip to content</a>
        <PwaProvider>
          <Header settings={settings} />
          <div id="main" tabIndex={-1}>{children}</div>
          <Footer settings={settings} />
        </PwaProvider>
      </body>
    </html>
  );
}
