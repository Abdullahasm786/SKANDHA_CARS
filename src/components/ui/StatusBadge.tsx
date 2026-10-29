import { cn } from "@/lib/utils/format";

const STYLES: Record<string, string> = {
  available: "bg-success-bg text-success",
  reserved: "bg-warn-bg text-warn",
  sold: "bg-danger-bg text-danger",
  published: "bg-success-bg text-success",
  draft: "bg-neutral-bg text-muted",
  archived: "bg-neutral-bg text-muted",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", STYLES[status] ?? "bg-neutral-bg text-muted", className)}>
      {status}
    </span>
  );
}
