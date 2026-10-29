import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSiteSettings, missingSettings } from "@/lib/settings";
import { dashboardData } from "@/lib/db/admin-repo";
import { formatDate, vehicleTitle } from "@/lib/utils/format";

export default async function Dashboard() {
  await requireAdmin();
  const [d, settings] = await Promise.all([dashboardData(), getSiteSettings()]);
  const recentAdded = { data: d.added }; const recentUpdated = { data: d.updated };
  const { available, reserved, sold, drafts, featured } = d.stats;
  const todo = missingSettings(settings);
  const stats: Array<[string, number]> = [["Available", available], ["Reserved", reserved], ["Sold", sold], ["Drafts", drafts], ["Featured", featured]];

  return (
    <div className="grid gap-10">
      <h1 className="display text-4xl">Dashboard</h1>
      {todo.length > 0 && (
        <section className="border border-line bg-warn-bg p-4 text-warn" aria-label="Setup checklist">
          <h2 className="font-semibold">Owner setup still needed</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">{todo.map((t) => <li key={t}>{t}</li>)}</ul>
          <Link href="/admin/settings" className="btn btn-sm mt-3">Open settings</Link>
        </section>
      )}
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map(([k, v]) => <div key={k} className="border border-line p-4"><dt className="eyebrow">{k}</dt><dd className="display mt-1 text-4xl">{v}</dd></div>)}
      </dl>
      <div className="grid gap-8 md:grid-cols-2">
        <Recent title="Recently added" rows={recentAdded.data ?? []} dateKey="created_at" />
        <Recent title="Recently updated" rows={recentUpdated.data ?? []} dateKey="updated_at" />
      </div>
    </div>
  );
}

function Recent({ title, rows, dateKey }: { title: string; rows: Array<Record<string, unknown>>; dateKey: string }) {
  return (
    <section><h2 className="display text-2xl">{title}</h2>
      {rows.length === 0 ? <p className="mt-2 text-muted">Nothing yet.</p> : (
        <ul className="mt-3 divide-y divide-line border-y border-line">{rows.map((r) => (
          <li key={String(r.id)} className="flex items-center justify-between gap-3 py-2">
            <Link className="underline" href={`/admin/cars/${r.id}/edit`}>{vehicleTitle(r as never)}</Link>
            <span className="flex items-center gap-2 text-xs text-muted"><StatusBadge status={String(r.inventory_status)} />{formatDate(String(r[dateKey]))}</span>
          </li>))}</ul>)}
    </section>
  );
}
