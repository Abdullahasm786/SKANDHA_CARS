"use client";
import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { InstallButton } from "@/components/pwa/PwaProvider";
import { INSTAGRAM_URL } from "@/lib/site";

const noopSubscribe = () => () => {};

export function MobileMenu({ links }: { links: Array<{ href: string; label: string }> }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  // The menu is portalled to <body>: the sticky header uses backdrop-filter, which would otherwise
  // become the containing block of a position:fixed child and clip/overlap the menu inside the header.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

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
      <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2 lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <FontAwesomeIcon icon={faBars} className="h-5 w-5" aria-hidden />
      </button>
      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              role="dialog" aria-modal="true" aria-label="Site menu"
              className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-bg px-5 pb-8 pt-4 lg:hidden"
              style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
              initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold tracking-tight">Menu</span>
                <button ref={closeRef} type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-surface-2" aria-label="Close menu" onClick={() => setOpen(false)}>
                  <FontAwesomeIcon icon={faXmark} className="h-6 w-6" aria-hidden />
                </button>
              </div>
              <nav className="mt-4 flex flex-col" aria-label="Mobile">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="border-b border-line py-4 text-2xl font-bold tracking-tight">
                    {l.label}
                  </Link>
                ))}
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="border-b border-line py-4 text-2xl font-bold tracking-tight">Instagram</a>
              </nav>
              <div className="mt-6"><InstallButton className="btn" /></div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
