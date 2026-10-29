"use client";
import { CheckCircle2, ChevronDown, ChevronUp, Circle } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

export type SetupItem = { label: string; done: boolean; href: string };
const KEY = "sc-setup-collapsed";
const subscribe = (cb: () => void) => { window.addEventListener("storage", cb); window.addEventListener("sc-setup", cb); return () => { window.removeEventListener("storage", cb); window.removeEventListener("sc-setup", cb); }; };
const read = () => { try { return localStorage.getItem(KEY) === "1"; } catch { return false; } };

/** Completion comes from persisted settings (server). Collapsing is a per-browser convenience; unresolved items stay one click away. */
export function SetupChecklist({ items }: { items: SetupItem[] }) {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  const done = items.filter((i) => i.done).length;
  if (done === items.length) return null;
  const toggle = () => { try { localStorage.setItem(KEY, collapsed ? "0" : "1"); } catch { /* storage unavailable */ } window.dispatchEvent(new Event("sc-setup")); };
  const pct = Math.round((done / items.length) * 100);
  return (
    <section className="card p-4" aria-label="Setup checklist">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Finish setting up your website <span className="font-normal text-muted">· {done} of {items.length} done</span></p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button onClick={toggle} className="btn btn-sm" aria-expanded={!collapsed}>{collapsed ? <>Show <ChevronDown size={14} aria-hidden /></> : <>Hide <ChevronUp size={14} aria-hidden /></>}</button>
      </div>
      {!collapsed && (
        <ul className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <li key={i.label}>
              <Link href={i.href} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2">
                {i.done ? <CheckCircle2 size={16} className="text-success" aria-hidden /> : <Circle size={16} className="text-muted" aria-hidden />}
                <span className={i.done ? "text-muted line-through" : ""}>{i.label}</span>
                <span className="sr-only">{i.done ? "(done)" : "(to do)"}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
