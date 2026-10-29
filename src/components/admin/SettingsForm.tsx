"use client";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import { removeLogo, saveSettings, uploadLogo } from "@/actions/settings";
import { Field, TextArea } from "@/components/forms/Field";
import type { SiteSettings } from "@/lib/settings";

export function LogoUploader({ logoUrl }: { logoUrl: string | null }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  async function go(file: File) {
    setBusy(true); setMsg(null);
    const fd = new FormData(); fd.set("file", file);
    const r = await uploadLogo(fd);
    setBusy(false); setMsg({ ok: r.ok, text: r.message }); router.refresh();
  }
  return (
    <div className="border border-line p-4">
      <h3 className="font-semibold">Logo</h3>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {logoUrl ? <img src={logoUrl} alt="Current logo" className="mt-3 max-h-20 w-auto bg-surface-2 p-2" /> : <p className="mt-2 text-sm text-muted">No logo uploaded — a text wordmark is shown.</p>}
      <p className="hint mt-2">PNG, JPEG, WebP or SVG (up to 8 MB). Proportions are never changed. SVGs are safely converted to PNG. Header, favicon, app-icon and social-sharing versions are generated automatically.</p>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" aria-label="Choose logo file"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void go(f); }} />
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn btn-sm" disabled={busy} onClick={() => ref.current?.click()}>{busy ? "Processing…" : logoUrl ? "Replace logo" : "Upload logo"}</button>
        {logoUrl && <button type="button" className="btn btn-sm btn-danger" disabled={busy} onClick={async () => { if (confirm("Remove the logo?")) { const r = await removeLogo(); setMsg({ ok: r.ok, text: r.message }); router.refresh(); } }}>Remove</button>}
      </div>
      <p role="status" className={`mt-2 text-sm ${msg?.ok ? "text-success" : "text-danger"}`}>{msg?.text}</p>
    </div>
  );
}

export function SettingsForm({ s }: { s: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettings, {});
  const e = state.errors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field name="brand_name" label="Brand name" defaultValue={s.brandName} />
      <Field name="whatsapp" label="Business WhatsApp number" defaultValue={s.whatsapp ? `+${s.whatsapp}` : ""} error={e.whatsapp} hint="Include the country code, e.g. +91… A bare 10-digit number is assumed to be Indian. Required for WhatsApp buttons." />
      <Field name="accent_colour" label="Brand accent colour" defaultValue={s.accentColour ?? ""} placeholder="#b6410f" error={e.accent_colour} hint="Optional hex colour sampled from the logo. Empty = neutral default." />
      <Field name="seo_title" label="Default SEO title" defaultValue={s.seoTitle ?? ""} />
      <Field name="seo_description" label="Default SEO description" defaultValue={s.seoDescription ?? ""} />
      <Field name="announcement" label="Announcement bar" defaultValue={s.announcement ?? ""} className="sm:col-span-2" hint="Shown above the header. Leave empty to hide." />
      <TextArea name="about" label="About page text" defaultValue={s.about ?? ""} rows={6} className="sm:col-span-2" hint="Blank line = new paragraph. Plain text only. Only verified claims." />
      <TextArea name="privacy" label="Privacy policy" defaultValue={s.privacy ?? ""} rows={8} className="sm:col-span-2" />
      <TextArea name="terms" label="Terms of use" defaultValue={s.terms ?? ""} rows={8} className="sm:col-span-2" />
      <div className="sm:col-span-2 flex items-center gap-3">
        <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
        <p role="status" className={state.ok ? "text-sm text-success" : "err"}>{state.message}</p>
      </div>
    </form>
  );
}
