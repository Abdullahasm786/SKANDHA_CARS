import Link from "next/link";
import { INSTAGRAM_URL } from "@/lib/site";
import type { SiteSettings } from "@/lib/settings";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="mx-3 mb-3 mt-24 rounded-[28px] bg-fg text-bg sm:mx-5 sm:mb-5" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="text-2xl font-extrabold tracking-tight">{settings.brandName}</p>
          <p className="mt-3 max-w-xs text-sm opacity-70">Pre-owned car resale and parking sales. Browse the cars, then ask us on WhatsApp.</p>
        </div>
        <nav aria-label="Footer" className="grid content-start gap-2 text-sm">
          <p className="mb-1 font-semibold opacity-60">Explore</p>
          <Link href="/#available" className="hover:text-accent">Available cars</Link>
          <Link href="/#sold" className="hover:text-accent">Sold cars</Link>
          <Link href="/about" className="hover:text-accent">About</Link>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-accent">Instagram</a>
        </nav>
        <nav aria-label="Legal" className="grid content-start gap-2 text-sm">
          <p className="mb-1 font-semibold opacity-60">More</p>
          <Link href="/privacy" className="hover:text-accent">Privacy</Link>
          <Link href="/terms" className="hover:text-accent">Terms</Link>
          <Link href="/admin" className="hover:text-accent">Admin</Link>
        </nav>
      </div>
      <p className="border-t border-white/10 px-6 py-5 text-xs opacity-60 sm:px-10">© {new Date().getFullYear()} {settings.brandName}</p>
    </footer>
  );
}
