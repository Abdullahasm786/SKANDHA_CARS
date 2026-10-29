import { CarFront, CheckCircle2, CircleDashed, Clock3, ExternalLink, Layers, Plus, Star, XCircle } from "lucide-react";
import Link from "next/link";
import { Greeting, TodayDate } from "@/components/admin/Greeting";
import { SetupChecklist, type SetupItem } from "@/components/admin/SetupChecklist";
import { EmptyState, PageHeader, StatCard, VehicleStatusBadge } from "@/components/admin/ui";
import { VehicleThumb } from "@/components/admin/VehicleThumb";
import { requireAdmin } from "@/lib/auth/require-admin";
import { dashboardData, listActivity } from "@/lib/db/admin-repo";
import { getSiteSettings } from "@/lib/settings";
import { formatDateTime, formatINR, vehicleTitle } from "@/lib/utils/format";

export const metadata = { title: "Overview" };

const MONTHS = new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" });

export default async function Overview() {
  await requireAdmin();
  const [d, activity, s] = await Promise.all([dashboardData(), listActivity(1, 8), getSiteSettings()]);
  const { stats } = d;

  const setup: SetupItem[] = [
    { label: "Upload original business logo", done: Boolean(s.logo), href: "/admin/settings" },
    { label: "Configure business WhatsApp number", done: Boolean(s.whatsapp), href: "/admin/settings" },
    { label: "Set default SEO description", done: Boolean(s.seoDescription), href: "/admin/settings?tab=website" },
    { label: "Complete About page content", done: Boolean(s.about), href: "/admin/settings?tab=website" },
    { label: "Complete privacy policy", done: Boolean(s.privacy), href: "/admin/settings?tab=website" },
    { label: "Complete terms and conditions", done: Boolean(s.terms), href: "/admin/settings?tab=website" },
  ];

  const months = d.byMonth.slice(-6);
  const max = Math.max(1, ...months.map((m) => m.n));

  return (
    <div className="grid gap-6">
      <PageHeader
        title={<Greeting name="Admin" />}
        description={<><TodayDate /> · {stats.available} available, {stats.reserved} reserved and {stats.drafts} in draft.</>}
        actions={<>
          <Link href="/admin/cars/new" className="btn btn-primary"><Plus size={16} aria-hidden /> Add vehicle</Link>
          <Link href="/admin/cars" className="btn"><Layers size={16} aria-hidden /> View inventory</Link>
          <Link href="/" target="_blank" className="btn"><ExternalLink size={16} aria-hidden /> View website</Link>
        </>}
      />

      <SetupChecklist items={setup} />

      <section aria-label="Inventory summary" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total vehicles" value={stats.total} hint="Excludes archived" href="/admin/cars" Icon={CarFront} />
        <StatCard label="Available" value={stats.available} hint="Published and for sale" href="/admin/cars?status=available&pub=published" Icon={CheckCircle2} tone="success" />
        <StatCard label="Reserved" value={stats.reserved} href="/admin/cars?status=reserved" Icon={Clock3} tone="warn" />
        <StatCard label="Sold" value={stats.sold} href="/admin/cars?status=sold" Icon={XCircle} tone="danger" />
        <StatCard label="Drafts" value={stats.drafts} hint="Not visible to customers" href="/admin/cars?pub=draft" Icon={CircleDashed} tone="muted" />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5" aria-labelledby="act">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="act" className="text-base font-semibold">Recent inventory activity</h2>
            <Link href="/admin/activity" className="text-sm font-medium text-accent-ink hover:underline">View all</Link>
          </div>
          {activity.rows.length === 0 ? (
            <EmptyState title="No activity yet" text="Adding a vehicle or changing its status will show up here." action={<Link href="/admin/cars/new" className="btn btn-primary btn-sm">Add vehicle</Link>} />
          ) : (
            <ul className="divide-y divide-line">
              {activity.rows.map((r) => (
                <li key={r.id}>
                  <Link href={r.vehicle ? `/admin/cars/${r.vehicle.id}` : "#"} className="flex items-center gap-3 py-3 hover:bg-surface-2/50">
                    <VehicleThumb images={r.vehicle?.images} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{r.vehicle ? vehicleTitle(r.vehicle) : "Deleted vehicle"}</span>
                      <span className="block truncate text-xs text-muted">
                        {r.previous_status ? `${r.kind === "inventory" ? "Inventory" : "Listing"}: ${r.previous_status} → ${r.new_status}` : `Created as ${r.new_status}`}
                        {r.vehicle ? ` · ${formatINR(r.vehicle.price_inr)}` : ""}
                      </span>
                    </span>
                    <span className="hidden text-right sm:block"><VehicleStatusBadge status={r.new_status} /><span className="mt-1 block text-[11px] text-muted">{formatDateTime(r.changed_at)}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid content-start gap-6">
          <section className="card p-5" aria-labelledby="chart">
            <h2 id="chart" className="text-base font-semibold">Listings added per month</h2>
            {months.length < 2 ? (
              <p className="mt-3 rounded-lg bg-surface-2 p-4 text-sm text-muted">A trend appears once your listings span two or more months. So far: {months[0] ? `${months[0].n} added in ${MONTHS.format(new Date(`${months[0].month}-01`))}` : "none yet"}.</p>
            ) : (
              <div className="mt-4 flex h-40 items-end gap-3" role="img" aria-label={`Listings added per month: ${months.map((m) => `${m.month} ${m.n}`).join(", ")}`}>
                {months.map((m) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-xs font-semibold">{m.n}</span>
                    <div className="w-full rounded-t-md bg-accent" style={{ height: `${(m.n / max) * 100}%`, minHeight: 4 }} title={`${m.n} added`} />
                    <span className="text-[11px] text-muted">{MONTHS.format(new Date(`${m.month}-01`))}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="card p-5" aria-labelledby="quick">
            <h2 id="quick" className="text-base font-semibold">Shortcuts</h2>
            <ul className="mt-3 grid gap-1 text-sm">
              <li><Link className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface-2" href="/admin/featured"><Star size={16} aria-hidden /> Featured vehicles <span className="ml-auto text-muted">{stats.featured}</span></Link></li>
              <li><Link className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface-2" href="/admin/cars?pub=draft"><CircleDashed size={16} aria-hidden /> Review drafts <span className="ml-auto text-muted">{stats.drafts}</span></Link></li>
              <li><Link className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-surface-2" href="/admin/settings"><CheckCircle2 size={16} aria-hidden /> Settings</Link></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
