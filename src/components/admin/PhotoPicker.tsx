"use client";
import { ArrowLeft, ArrowRight, ImagePlus, Star, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const MAX_FILES = 20, MAX_BYTES = 8 * 1024 * 1024, TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Holds the files chosen before the vehicle exists; they are uploaded (in this order, first = cover) right after saving. */
export function PhotoPicker({ files, onChange, disabled }: { files: File[]; onChange: (f: File[]) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  function add(list: FileList | File[]) {
    const errs: string[] = []; const ok: File[] = [];
    for (const f of Array.from(list)) {
      if (!TYPES.includes(f.type)) errs.push(`${f.name}: only JPEG, PNG or WebP`);
      else if (f.size > MAX_BYTES) errs.push(`${f.name}: larger than 8 MB`);
      else if (files.length + ok.length >= MAX_FILES) { errs.push(`Maximum ${MAX_FILES} photos`); break; }
      else ok.push(f);
    }
    setErrors(errs);
    if (ok.length) onChange([...files, ...ok]);
  }
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= files.length) return; const n = [...files]; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };

  return (
    <div>
      <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) add(e.dataTransfer.files); }}
        className={`grid place-items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${drag ? "border-accent bg-accent/5" : "border-line-strong"}`}>
        <ImagePlus size={26} className="text-muted" aria-hidden />
        <p className="mt-2 text-sm font-medium">Drag photos here or <button type="button" className="text-accent-ink underline" onClick={() => input.current?.click()} disabled={disabled}>browse</button></p>
        <p className="hint">JPEG, PNG or WebP · up to 8 MB each · up to {MAX_FILES} photos. The first photo is the cover.</p>
        <input ref={input} type="file" multiple accept={TYPES.join(",")} className="sr-only" aria-label="Choose photos" onChange={(e) => { if (e.target.files) add(e.target.files); e.target.value = ""; }} />
      </div>
      {errors.length > 0 && <ul role="alert" className="mt-2 grid gap-0.5 text-sm text-danger">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
      {files.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className="relative aspect-[4/3] bg-surface-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urls[i]} alt={`Preview of ${f.name}`} className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-fg">Cover</span>}
                <button type="button" onClick={() => onChange(files.filter((_, k) => k !== i))} disabled={disabled} aria-label={`Remove ${f.name}`} className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"><X size={13} aria-hidden /></button>
              </div>
              <div className="flex items-center justify-between p-1.5">
                <button type="button" className="grid h-7 w-7 place-items-center rounded hover:bg-surface-2 disabled:opacity-30" disabled={i === 0 || disabled} onClick={() => move(i, -1)} aria-label="Move earlier"><ArrowLeft size={14} aria-hidden /></button>
                <button type="button" className="grid h-7 w-7 place-items-center rounded hover:bg-surface-2 disabled:opacity-30" disabled={i === 0 || disabled} onClick={() => { const n = [...files]; n.unshift(n.splice(i, 1)[0]); onChange(n); }} aria-label="Make cover"><Star size={14} aria-hidden /></button>
                <button type="button" className="grid h-7 w-7 place-items-center rounded hover:bg-surface-2 disabled:opacity-30" disabled={i === files.length - 1 || disabled} onClick={() => move(i, 1)} aria-label="Move later"><ArrowRight size={14} aria-hidden /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
