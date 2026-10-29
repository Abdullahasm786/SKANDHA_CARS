"use client";
import { ArrowDown, ArrowUp, RefreshCw, Star, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { deleteVehicleImage, reorderImages, replaceVehicleImage, setPrimaryImage, updateImageAlt, uploadVehicleImage } from "@/actions/images";
import { vehicleImageUrl } from "@/lib/storage/urls";
import type { VehicleImage } from "@/lib/types";

type Job = { name: string; state: "queued" | "uploading" | "done" | "failed"; error?: string; file: File };

export async function uploadFiles(vehicleId: string, files: File[], onUpdate: (jobs: Job[]) => void) {
  const jobs: Job[] = files.map((file) => ({ name: file.name, file, state: "queued" }));
  onUpdate([...jobs]);
  for (const job of jobs) {
    job.state = "uploading"; onUpdate([...jobs]);
    const fd = new FormData(); fd.set("file", job.file);
    try {
      const res = await uploadVehicleImage(vehicleId, fd);
      job.state = res.ok ? "done" : "failed"; job.error = res.message;
    } catch { job.state = "failed"; job.error = "Network error — retry."; }
    onUpdate([...jobs]);
  }
  return jobs;
}

export function UploadQueue({ jobs, onRetry }: { jobs: Job[]; onRetry: (j: Job) => void }) {
  if (jobs.length === 0) return null;
  return (
    <ul className="mt-3 grid gap-1 text-sm" aria-live="polite">
      {jobs.map((j, i) => (
        <li key={i} className="flex items-center justify-between gap-2 border border-line px-3 py-2">
          <span className="truncate">{j.name}</span>
          <span className={j.state === "failed" ? "text-danger" : j.state === "done" ? "text-success" : "text-muted"}>
            {j.state === "queued" && "Waiting…"}{j.state === "uploading" && "Uploading…"}{j.state === "done" && "Uploaded"}
            {j.state === "failed" && <>{j.error} <button type="button" className="underline" onClick={() => onRetry(j)}>Retry</button></>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ImageManager({ vehicleId, images, title }: { vehicleId: string; images: VehicleImage[]; title: string }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);

  async function run(fn: () => Promise<{ ok: boolean; message?: string }>) {
    setBusy(true); setMsg(null);
    const r = await fn();
    setBusy(false);
    if (!r.ok) setMsg(r.message ?? "Something went wrong.");
    router.refresh();
  }
  async function upload(files: File[]) {
    setBusy(true);
    await uploadFiles(vehicleId, files, setJobs);
    setBusy(false); router.refresh();
  }
  const move = (i: number, d: number) => {
    const ids = sorted.map((x) => x.id); const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    void run(() => reorderImages(vehicleId, ids));
  };

  return (
    <section aria-labelledby="photos" className="mt-10">
      <h2 id="photos" className="display text-2xl">Photos</h2>
      <p className="hint">JPEG, PNG or WebP up to 8 MB. Photos are resized and stripped of metadata (including location data) on upload.</p>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" id="photo-input" aria-label="Choose photos"
        onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ""; if (f.length) void upload(f); }} />
      <button type="button" className="btn mt-3" disabled={busy} onClick={() => input.current?.click()}>Upload photos</button>
      <UploadQueue jobs={jobs} onRetry={(j) => void upload([j.file])} />
      {msg && <p role="alert" className="err mt-2">{msg}</p>}
      {sorted.length === 0 ? <p className="mt-4 text-muted">No photos yet.</p> : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((img, i) => (
            <li key={img.id} className="border border-line bg-surface p-3">
              <div className="relative aspect-[4/3] bg-surface-2"><Image src={vehicleImageUrl(img.storage_path)} alt={img.alt_text || title} fill sizes="320px" className="object-cover" />
                {img.is_primary && <span className="absolute left-2 top-2 bg-accent px-2 py-0.5 text-xs font-semibold text-accent-fg">Primary</span>}</div>
              <label className="label mt-2" htmlFor={`alt-${img.id}`}>Alt text</label>
              <input id={`alt-${img.id}`} className="field" defaultValue={img.alt_text ?? ""} placeholder={`e.g. Front view of ${title}`} maxLength={200}
                onBlur={(e) => { if (e.target.value !== (img.alt_text ?? "")) void run(() => updateImageAlt(vehicleId, img.id, e.target.value)); }} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button type="button" className="btn btn-sm" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label="Move earlier"><ArrowUp size={14} aria-hidden /></button>
                <button type="button" className="btn btn-sm" disabled={busy || i === sorted.length - 1} onClick={() => move(i, 1)} aria-label="Move later"><ArrowDown size={14} aria-hidden /></button>
                <button type="button" className="btn btn-sm" disabled={busy || img.is_primary} onClick={() => void run(() => setPrimaryImage(vehicleId, img.id))}><Star size={14} aria-hidden /> Primary</button>
                <label className="btn btn-sm cursor-pointer"><RefreshCw size={14} aria-hidden /> Replace
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy}
                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) { const fd = new FormData(); fd.set("file", f); void run(() => replaceVehicleImage(vehicleId, img.id, fd)); } }} /></label>
                <button type="button" className="btn btn-sm btn-danger" disabled={busy} onClick={() => { if (confirm("Delete this photo permanently?")) void run(() => deleteVehicleImage(vehicleId, img.id)); }} aria-label="Delete photo"><Trash2 size={14} aria-hidden /></button>
              </div>
            </li>))}
        </ul>)}
    </section>
  );
}
