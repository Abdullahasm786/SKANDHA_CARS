"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { InstallButton } from "@/components/pwa/PwaProvider";

export function MobileMenu({ links }: { links: Array<{ href: string; label: string }> }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button type="button" className="inline-flex h-11 w-11 items-center justify-center lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <Menu size={22} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog" aria-modal="true" aria-label="Site menu"
            className="fixed inset-0 z-50 flex flex-col bg-bg p-6 lg:hidden"
            initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          >
            <div className="flex justify-end">
              <button ref={closeRef} type="button" className="inline-flex h-11 w-11 items-center justify-center" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X size={24} aria-hidden />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="display border-b border-line py-4 text-3xl">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-6"><InstallButton className="btn" /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
