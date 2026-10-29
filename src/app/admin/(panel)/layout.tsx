import Link from "next/link";
import { logout } from "@/actions/auth";
import { requireAdmin } from "@/lib/auth/require-admin";

const LINKS = [
  { href: "/admin", label: "Dashboard" }, { href: "/admin/cars", label: "Inventory" },
  { href: "/admin/cars/new", label: "Add car" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <nav aria-label="Admin" className="flex flex-wrap gap-1 text-sm font-medium">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className="px-3 py-2 hover:bg-surface-2">{l.label}</Link>)}
        </nav>
        <form action={logout} className="flex items-center gap-3 text-sm text-muted">
          <span className="hidden sm:inline">{user.email}</span>
          <button className="btn btn-sm">Sign out</button>
        </form>
      </div>
      <div className="pt-6">{children}</div>
    </div>
  );
}
