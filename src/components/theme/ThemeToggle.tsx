"use client";
import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
};
const getTheme = () => document.documentElement.dataset.theme ?? "light";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="inline-flex h-11 w-11 items-center justify-center hover:bg-surface-2"
      aria-label={`Switch to ${next} theme`}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem("theme", next); } catch { /* storage unavailable */ }
      }}
    >
      {theme === "dark" ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
    </button>
  );
}
