import { AlertTriangle, CheckCircle2, CircleDashed, Clock3, Inbox, type LucideIcon, XCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/format";

const BADGE: Record<string, { cls: string; Icon: LucideIcon; text: string }> = {
  available: { cls: "bg-success-bg text-success", Icon: CheckCircle2, text: "Available" },
  reserved: { cls: "bg-warn-bg text-warn", Icon: Clock3, text: "Reserved" },
  sold: { cls: "bg-danger-bg text-danger", Icon: XCircle, text: "Sold" },
  draft: { cls: "bg-neutral-bg text-muted", Icon: CircleDashed, text: "Draft" },
  published: { cls: "bg-success-bg text-success", Icon: CheckCircle2, text: "Published" },
  archived: { cls: "bg-neutral-bg text-muted", Icon: Inbox, text: "Archived" },
};

/** Status is conveyed by icon + text, never colour alone. */
export function VehicleStatusBadge({ status, className }: { status: string; className?: string }) {
  const b = BADGE[status] ?? { cls: "bg-neutral-bg text-muted", Icon: AlertTriangle, text: status };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold", b.cls, className)}>
      <b.Icon size={12} aria-hidden />{b.text}
    </span>
  );
}

export function PageHeader({ title, description, actions }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="display text-2xl sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, href, Icon, tone = "default" }: {
  label: string; value: number; hint?: string; href: string; Icon: LucideIcon; tone?: "default" | "success" | "warn" | "danger" | "muted";
}) {
  const tones = { default: "bg-accent/10 text-accent-ink", success: "bg-success-bg text-success", warn: "bg-warn-bg text-warn", danger: "bg-danger-bg text-danger", muted: "bg-neutral-bg text-muted" };
  return (
    <Link href={href} className="card group flex items-center gap-4 p-4 transition-colors hover:border-line-strong hover:bg-surface-2/60" aria-label={`${label}: ${value}. View`}>
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", tones[tone])}><Icon size={20} aria-hidden /></span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-muted">{label}</span>
        <span className="block text-2xl font-bold leading-tight tracking-tight">{value}</span>
        {hint && <span className="block truncate text-xs text-muted">{hint}</span>}
      </span>
    </Link>
  );
}

export function EmptyState({ title, text, action, Icon = Inbox }: { title: string; text?: string; action?: React.ReactNode; Icon?: LucideIcon }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-line-strong px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted"><Icon size={22} aria-hidden /></span>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
