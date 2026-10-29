import Link from "next/link";
import { Logo } from "@/components/branding/Logo";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { InstallButton } from "@/components/pwa/PwaProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { WhatsappButton } from "@/components/ui/WhatsappButton";
import type { SiteSettings } from "@/lib/settings";
import { GENERAL_MESSAGE, normalizeWhatsapp } from "@/lib/whatsapp";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#available", label: "Available cars" },
  { href: "/#sold", label: "Sold cars" },
  { href: "/about", label: "About" },
];

export function Header({ settings }: { settings: SiteSettings }) {
  const wa = normalizeWhatsapp(settings.whatsapp);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {settings.announcement && <p className="bg-fg px-4 py-1.5 text-center text-xs font-medium text-bg">{settings.announcement}</p>}
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <Logo settings={settings} />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-fg">{l.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <InstallButton className="btn btn-sm hidden xl:inline-flex" />
          <WhatsappButton number={wa} message={GENERAL_MESSAGE} label="WhatsApp" size="sm" className="hidden sm:inline-flex" />
          <ThemeToggle />
          <MobileMenu links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
