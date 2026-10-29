"use client";
import {
  Car, CarFront, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Clock3, ExternalLink, History, LayoutDashboard,
  LogOut, Menu, Plus, Search, Settings, Star, X, XCircle, Globe, type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/actions/auth";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils/format";
import { ToastProvider } from "./Toast";

type Item = { label: string; href: string; Icon: LucideIcon; match: (p: string, q: URLSearchParams) => boolean; external?: boolean };
const noFilter = (q: URLSearchParams) => !q.get("status") && !q.get("pub") && !q.get("featured");
const NAV: Array<{ group: string; items: Item[] }> = [
  { group: "Main", items: [
    { label: "Overview", href: "/admin", Icon: LayoutDashboard, match: (p) => p === "/admin" },
    { label: "All Vehicles", href: "/admin/cars", Icon: Car, match: (p, q) => p.startsWith("/admin/cars") && p !== "/admin/cars/new" && noFilter(q) },
    { label: "Available Cars", href: "/admin/cars?status=available&pub=published", Icon: CheckCircle2, match: (p, q) => p === "/admin/cars" && q.get("status") === "available" },
    { label: "Reserved Cars", href: "/admin/cars?status=reserved", Icon: Clock3, match: (p, q) => p === "/admin/cars" && q.get("status") === "reserved" },
    { label: "Sold Cars", href: "/admin/cars?status=sold", Icon: XCircle, match: (p, q) => p === "/admin/cars" && q.get("status") === "sold" },
    { label: "Drafts", href: "/admin/cars?pub=draft", Icon: CircleDashed, match: (p, q) => p === "/admin/cars" && q.get("pub") === "draft" },
  ] },
  { group: "Business", items: [
    { label: "Featured Vehicles", href: "/admin/featured", Icon: Star, match: (p) => p.startsWith("/admin/featured") },
    { label: "Inventory Activity", href: "/admin/activity", Icon: History, match: (p) => p.startsWith("/admin/activity") },
    { label: "Website Settings", href: "/admin/settings?tab=website", Icon: Globe, match: (p, q) => p.startsWith("/admin/settings") && q.get("tab") === "website" },
  ] },
  { group: "System", items: [
    { label: "Settings", href: "/admin/settings", Icon: Settings, match: (p, q) => p.startsWith("/admin/settings") && q.get("tab") !== "website" },
    { label: "View Customer Website", href: "/", Icon: ExternalLink, match: () => false, external: true },
  ] },
];

const CRUMBS: Record<string, string> = { admin: "Admin", cars: "Vehicles", new: "Add vehicle", edit: "Edit", featured: "Featured", activity: "Activity", settings: "Settings" };

export function AdminShell({ brandName, logoUrl, email, children }: { brandName: string; logoUrl: string | null; email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => { setDrawer(false); setMenu(false); }, [pathname, sp]);
  useEffect(() => {
    if (!drawer) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [drawer]);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((s, i) => ({ label: CRUMBS[s] ?? (s.length > 20 ? "Details" : s), href: "/" + segments.slice(0, i + 1).join("/") }));
  const title = crumbs.length > 1 ? crumbs[crumbs.length - 1].label : "Overview";

  const nav = (compact: boolean) => (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-4">
      {NAV.map((g) => (
        <div key={g.group} className="mt-5 first:mt-2">
          {!compact && <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/40">{g.group}</p>}
          <ul className="grid gap-0.5">
            {g.items.map((it) => {
              const active = it.match(pathname, sp);
              return (
                <li key={it.label}>
                  <Link href={it.href} title={compact ? it.label : undefined} aria-label={compact ? it.label : undefined} aria-current={active ? "page" : undefined}
                    target={it.external ? "_blank" : undefined}
                    className={cn("group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white", compact && "justify-center px-0")}>
                    {active && <span className="absolute left-0 top-1.5 h-6 w-0.5 rounded-full bg-[#6f95ff]" aria-hidden />}
                    <it.Icon size={18} className="shrink-0" aria-hidden />
                    {!compact && <span className="truncate">{it.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <form action={logout} className="mt-5">
        <button title={compact ? "Sign out" : undefined} aria-label="Sign out" className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/65 hover:bg-white/5 hover:text-white", compact && "justify-center px-0")}>
          <LogOut size={18} aria-hidden />{!compact && "Sign Out"}
        </button>
      </form>
    </nav>
  );

  const brand = (compact: boolean) => (
    <div className={cn("flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4", compact && "justify-center px-0")}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg bg-white object-contain p-0.5" />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#2a56c6] text-white"><CarFront size={20} aria-hidden /></span>
      )}
      {!compact && <span className="min-w-0"><span className="block truncate text-sm font-bold text-white">{brandName}</span><span className="block text-[11px] text-white/45">Admin</span></span>}
    </div>
  );

  return (
    <ToastProvider>
      <div className="admin min-h-dvh">
        <aside className={cn("fixed inset-y-0 left-0 z-30 hidden flex-col bg-[#14171d] transition-[width] duration-200 lg:flex", collapsed ? "w-[72px]" : "w-[264px]")}>
          {brand(collapsed)}
          {nav(collapsed)}
          <button onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={collapsed}
            className="m-3 flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-medium text-white/55 hover:bg-white/5 hover:text-white">
            {collapsed ? <ChevronRight size={16} aria-hidden /> : <><ChevronLeft size={16} aria-hidden /> Collapse</>}
          </button>
        </aside>

        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
            <button className="absolute inset-0 bg-black/55" aria-label="Close menu" onClick={() => setDrawer(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-[#14171d] shadow-2xl">
              <div className="flex items-center justify-between pr-2">{brand(false)}
                <button className="grid h-10 w-10 place-items-center rounded-lg text-white/70 hover:bg-white/10" aria-label="Close menu" onClick={() => setDrawer(false)}><X size={20} aria-hidden /></button></div>
              {nav(false)}
            </div>
          </div>
        )}

        <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-[264px]")}>
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur sm:px-6" style={{ paddingTop: "env(safe-area-inset-top)" }}>
            <button className="grid h-10 w-10 place-items-center rounded-lg hover:bg-surface-2 lg:hidden" aria-label="Open menu" onClick={() => setDrawer(true)}><Menu size={20} aria-hidden /></button>
            <div className="min-w-0 flex-1">
              <nav aria-label="Breadcrumb" className="hidden text-xs text-muted sm:block">
                <ol className="flex items-center gap-1.5">{crumbs.map((c, i) => (
                  <li key={c.href} className="flex items-center gap-1.5">{i > 0 && <span aria-hidden>/</span>}
                    {i === crumbs.length - 1 ? <span aria-current="page" className="font-medium text-fg">{c.label}</span> : <Link href={c.href} className="hover:text-fg">{c.label}</Link>}</li>))}</ol>
              </nav>
              <p className="truncate text-sm font-semibold sm:hidden">{title}</p>
            </div>
            <form action="/admin/cars" role="search" className="relative hidden md:block">
              <label htmlFor="top-q" className="sr-only">Search vehicles</label>
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <input id="top-q" name="q" placeholder="Search vehicles" className="field !min-h-9 w-56 !pl-9 lg:w-72" />
            </form>
            <Link href="/admin/cars" className="grid h-10 w-10 place-items-center rounded-lg hover:bg-surface-2 md:hidden" aria-label="Search vehicles"><Search size={18} aria-hidden /></Link>
            <Link href="/admin/cars/new" className="btn btn-primary btn-sm"><Plus size={16} aria-hidden /><span className="hidden sm:inline">Add vehicle</span><span className="sr-only sm:hidden">Add vehicle</span></Link>
            <ThemeToggle />
            <div className="relative">
              <button className="grid h-9 w-9 place-items-center rounded-full bg-accent text-sm font-bold text-accent-fg" aria-haspopup="menu" aria-expanded={menu} aria-label="Account menu" onClick={() => setMenu((m) => !m)}>
                {email.charAt(0).toUpperCase() || "A"}
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 mt-2 w-64 rounded-xl border border-line bg-surface p-2 shadow-xl">
                  <p className="truncate px-3 py-2 text-xs text-muted">Signed in as<br /><span className="text-sm font-semibold text-fg">{email}</span></p>
                  <Link role="menuitem" href="/admin/settings?tab=account" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2">Account &amp; security</Link>
                  <Link role="menuitem" href="/" target="_blank" className="block rounded-lg px-3 py-2 text-sm hover:bg-surface-2">View customer website</Link>
                  <form action={logout}><button role="menuitem" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger-bg">Sign out</button></form>
                </div>
              )}
            </div>
          </header>
          <main id="admin-main" className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:py-8">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
