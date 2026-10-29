"use client";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState } from "react";

type Toast = { id: number; ok: boolean; text: string };
const Ctx = createContext<(ok: boolean, text: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const n = useRef(0);
  const push = useCallback((ok: boolean, text: string) => {
    const id = ++n.current;
    setItems((l) => [...l.slice(-3), { id, ok, text }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), ok ? 4000 : 7000);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" role="region" aria-label="Notifications" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} role={t.ok ? "status" : "alert"} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 text-sm shadow-lg">
            {t.ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" aria-hidden /> : <XCircle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden />}
            <p className="flex-1">{t.text}</p>
            <button className="text-muted hover:text-fg" aria-label="Dismiss" onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))}><X size={16} aria-hidden /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
