"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

export function ConfirmDialog({ open, title, children, confirmLabel, danger, busy, onConfirm, onCancel }: {
  open: boolean; title: string; children: React.ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  const reduce = useReducedMotion();
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" role="presentation"
          initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="cd-title" className="w-full max-w-md border border-line bg-surface p-6">
            <h2 id="cd-title" className="display text-2xl">{title}</h2>
            <div className="mt-3 text-sm text-muted">{children}</div>
            <div className="mt-6 flex justify-end gap-2">
              <button ref={cancelRef} className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
              <button className={danger ? "btn btn-danger" : "btn btn-primary"} onClick={onConfirm} disabled={busy}>{busy ? "Working…" : confirmLabel}</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
