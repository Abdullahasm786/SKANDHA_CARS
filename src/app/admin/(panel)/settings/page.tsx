import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { BusinessForm, ListingForm, LogoUploader, PasswordForm, WebsiteForm } from "@/components/admin/SettingsForm";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSiteSettings } from "@/lib/settings";

export const metadata = { title: "Settings" };
const TABS = [["business", "Business"], ["website", "Website content"], ["listing", "Listings"], ["account", "Account & security"]] as const;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { user } = await requireAdmin();
  const s = await getSiteSettings();
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : "business";
  const checks: Array<[string, boolean]> = [["Logo", Boolean(s.logo)], ["WhatsApp number", Boolean(s.whatsapp)], ["SEO description", Boolean(s.seoDescription)], ["Privacy policy", Boolean(s.privacy)], ["Terms", Boolean(s.terms)]];
  return (
    <div>
      <PageHeader title="Settings" description="Everything here is saved to the database and applied to the website immediately." />
      <nav aria-label="Settings sections" className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/admin/settings?tab=${k}`} aria-current={tab === k ? "page" : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${tab === k ? "border-accent text-accent-ink" : "border-transparent text-muted hover:text-fg"}`}>{l}</Link>
        ))}
      </nav>
      <div className="card p-5 sm:p-6">
        {tab === "business" && <div className="grid gap-6"><LogoUploader logoUrl={s.logo?.header ?? null} /><BusinessForm s={s} />
          <ul className="flex flex-wrap gap-2 text-xs">{checks.map(([l, ok]) => <li key={l} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1">{ok ? <CheckCircle2 size={12} className="text-success" aria-hidden /> : <Circle size={12} className="text-muted" aria-hidden />}{l}<span className="sr-only">{ok ? " done" : " missing"}</span></li>)}</ul></div>}
        {tab === "website" && <WebsiteForm s={s} />}
        {tab === "listing" && <ListingForm s={s} />}
        {tab === "account" && (
          <div className="grid gap-6">
            <div className="rounded-lg bg-surface-2 p-4 text-sm"><p className="text-muted">Signed in as</p><p className="font-semibold">{user.email}</p><p className="mt-1 text-xs text-muted">Role: administrator</p></div>
            <div><h2 className="mb-3 text-base font-semibold">Change password</h2><PasswordForm /></div>
          </div>)}
      </div>
    </div>
  );
}
