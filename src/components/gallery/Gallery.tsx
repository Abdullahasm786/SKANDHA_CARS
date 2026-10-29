"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export interface GalleryImage { src: string; thumb: string; alt: string }

export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [full, setFull] = useState(false);
  const reduce = useReducedMotion();
  const n = images.length;
  const go = useCallback((d: number) => setIndex((i) => (i + d + n) % n), [n]);

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [full, go]);

  if (n === 0) {
    return <div className="flex aspect-[4/3] items-center justify-center bg-surface-2 text-muted">Photos coming soon</div>;
  }
  const cur = images[index];
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-surface-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={index} className="absolute inset-0"
            initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <Image src={cur.src} alt={cur.alt} fill priority={index === 0} sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
        {n > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-bg/85"><ChevronLeft aria-hidden /></button>
            <button type="button" aria-label="Next photo" onClick={() => go(1)} className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-bg/85"><ChevronRight aria-hidden /></button>
          </>
        )}
        <button type="button" aria-label="View full screen" onClick={() => setFull(true)} className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center bg-bg/85"><Expand size={18} aria-hidden /></button>
        <p className="absolute bottom-2 left-2 bg-bg/85 px-2 py-1 text-xs" aria-live="polite">{index + 1} / {n}</p>
      </div>
      {n > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((im, i) => (
            <li key={im.thumb} className="shrink-0">
              <button type="button" aria-label={`Show photo ${i + 1}`} aria-current={i === index} onClick={() => setIndex(i)}
                className={`relative block h-16 w-24 overflow-hidden rounded-xl border-2 ${i === index ? "border-accent" : "border-transparent"}`}>
                <Image src={im.thumb} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <AnimatePresence>
        {full && (
          <motion.div role="dialog" aria-modal="true" aria-label={`${title} photos`} className="fixed inset-0 z-[80] bg-black"
            initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Image src={cur.src} alt={cur.alt} fill sizes="100vw" className="object-contain" />
            <button type="button" aria-label="Close full screen" onClick={() => setFull(false)} autoFocus className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center bg-white/90 text-black"><X aria-hidden /></button>
            {n > 1 && (
              <>
                <button type="button" aria-label="Previous photo" onClick={() => go(-1)} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/90 text-black"><ChevronLeft aria-hidden /></button>
                <button type="button" aria-label="Next photo" onClick={() => go(1)} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-white/90 text-black"><ChevronRight aria-hidden /></button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
