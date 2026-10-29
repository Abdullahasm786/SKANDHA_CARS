"use client";
import { Download, WifiOff } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }>; }
const Ctx = createContext<{ canInstall: boolean; install: () => void }>({ canInstall: false, install: () => {} });
export const useInstall = () => useContext(Ctx);

const subOnline = (cb: () => void) => {
  window.addEventListener("online", cb); window.addEventListener("offline", cb);
  return () => { window.removeEventListener("online", cb); window.removeEventListener("offline", cb); };
};

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const online = useSyncExternalStore(subOnline, () => navigator.onLine, () => true);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      const hadController = Boolean(navigator.serviceWorker.controller);
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          sw?.addEventListener("statechange", () => {
            if (sw.state === "installed" && navigator.serviceWorker.controller) setWaiting(sw);
          });
        });
      }).catch(() => {});
      let reloaded = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
    }
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const install = useCallback(() => { void deferred?.prompt(); setDeferred(null); }, [deferred]);

  return (
    <Ctx.Provider value={{ canInstall: Boolean(deferred), install }}>
      {!online && (
        <div role="status" className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-warn-bg px-4 py-2 text-center text-sm text-warn">
          <WifiOff size={16} aria-hidden /> You&apos;re offline. Pages shown may be saved copies — availability and prices may be out of date, and changes will not be saved.
        </div>
      )}
      {children}
      {waiting && (
        <div role="status" className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-center justify-between gap-3 border border-line bg-surface p-3 shadow-lg" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          <span className="text-sm">A new version is available.</span>
          <button className="btn btn-primary btn-sm" onClick={() => waiting.postMessage({ type: "SKIP_WAITING" })}>Update</button>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function InstallButton({ className }: { className?: string }) {
  const { canInstall, install } = useInstall();
  if (!canInstall) return null;
  return (
    <button type="button" onClick={install} className={className ?? "btn btn-sm"}>
      <Download size={16} aria-hidden /> Install app
    </button>
  );
}
