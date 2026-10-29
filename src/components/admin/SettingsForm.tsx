"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { changePassword } from "@/actions/account";
import { removeLogo, saveSettings, uploadLogo } from "@/actions/settings";
import { Field, Select, TextArea } from "@/components/forms/Field";
import type { SiteSettings } from "@/lib/settings";
import type { ActionState } from "@/lib/validation/common";
import { useToast } from "./Toast";

export function LogoUploader({ logoUrl }: { logoUrl: string | null }) {
  const router = useRouter(); const toast = useToast();
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  async function go(file: File) {
    setBusy(true);
    const fd = new FormData(); fd.set("file", file);
    const r = await uploadLogo(fd);
    setBusy(false); toast(r.ok, r.message); router.refresh();
  }
  return (
    <div className="rounded-xl border border-line p-4">
      <h3 className="text-sm font-semibold">Business logo</h3>
      <div className="mt-3 flex min-h-20 items-center rounded-lg bg-surface-2 p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {logoUrl ? <img src={logoUrl} alt="Current logo" className="max-h-16 w-auto" /> : <p className="text-sm text-muted">No logo uploaded — the website shows a text wordmark.</p>}
      </div>
      <p className="hint mt-2">PNG, JPEG, WebP or SVG up to 8 MB. Proportions are never changed; header, app-icon, favicon and social-sharing versions are generated automatically.</p>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" aria-label="Choose logo file" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void go(f); }} />
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn btn-sm" disabled={busy} onClick={() => ref.current?.click()}>{busy ? "Processing…" : logoUrl ? "Replace logo" : "Upload logo"}</button>
        {logoUrl && <button type="button" className="btn btn-sm btn-danger" disabled={busy} onClick={async () => { if (confirm("Remove the logo?")) { const r = await removeLogo(); toast(r.ok, r.message); router.refresh(); } }}>Remove</button>}
      </div>
    </div>
  );
}

function useSaved(state: ActionState) {
  const toast = useToast();
  const last = useRef<ActionState>(state);
  useEffect(() => { if (state !== last.current && state.message) { toast(Boolean(state.ok), state.message); } last.current = state; }, [state, toast]);
}

function SaveBar({ pending, state }: { pending: boolean; state: ActionState }) {
  return (
    <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
      <button className="btn btn-primary" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>
      {state.message && !state.ok && <p role="alert" className="err">{state.message}</p>}
    </div>
  );
}

export function BusinessForm({ s }: { s: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettings, {}); useSaved(state);
  const e = state.errors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field name="brand_name" label="Business name" defaultValue={s.brandName} />
      <Field name="whatsapp" label="Business WhatsApp number" defaultValue={s.whatsapp ? `+${s.whatsapp}` : ""} error={e.whatsapp} hint="Include the country code, e.g. +91… Powers every WhatsApp button on the website." />
      <TextArea name="business_description" label="Business description" defaultValue={s.businessDescription ?? ""} rows={3} className="sm:col-span-2" hint="A short sentence shown at the top of the About page." />
      <div className="sm:col-span-2"><SaveBar pending={pending} state={state} /></div>
    </form>
  );
}

export function WebsiteForm({ s }: { s: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettings, {}); useSaved(state);
  const e = state.errors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field name="seo_title" label="Default SEO title" defaultValue={s.seoTitle ?? ""} maxLength={120} />
      <Field name="seo_description" label="Default SEO description" defaultValue={s.seoDescription ?? ""} maxLength={320} hint="Shown in search results and link previews." />
      <Field name="announcement" label="Announcement bar" defaultValue={s.announcement ?? ""} className="sm:col-span-2" hint="Shown above the website header. Leave empty to hide." />
      <Field name="accent_colour" label="Website accent colour" defaultValue={s.accentColour ?? ""} placeholder="#f5b50a" error={e.accent_colour} hint="Optional hex colour. Empty = the default gold." />
      <div />
      <TextArea name="about" label="Additional About page text" defaultValue={s.about ?? ""} rows={5} className="sm:col-span-2" hint="Optional extra paragraphs shown on the About page. Blank line = new paragraph." />
      <div className="sm:col-span-2 rounded-lg bg-warn-bg p-3 text-sm text-warn">The privacy policy and terms below are published as written. They are not legal advice — have your own approved text reviewed before publishing.</div>
      <TextArea name="privacy" label="Privacy policy" defaultValue={s.privacy ?? ""} rows={8} className="sm:col-span-2" />
      <TextArea name="terms" label="Terms and conditions" defaultValue={s.terms ?? ""} rows={8} className="sm:col-span-2" />
      <div className="sm:col-span-2"><SaveBar pending={pending} state={state} /></div>
    </form>
  );
}

export function ListingForm({ s }: { s: SiteSettings }) {
  const [state, action, pending] = useActionState(saveSettings, {}); useSaved(state);
  return (
    <form action={action} className="grid max-w-xl gap-4">
      <dl className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-surface-2 p-3"><dt className="text-muted">Currency</dt><dd className="font-semibold">Indian rupee (₹)</dd></div>
        <div className="rounded-lg bg-surface-2 p-3"><dt className="text-muted">Odometer unit</dt><dd className="font-semibold">Kilometres</dd></div></dl>
      <Select name="default_publication" label="Default visibility for new vehicles" defaultValue={s.defaultPublication} options={[["draft", "Draft — review before publishing"], ["published", "Published — visible immediately"]]} hint="A vehicle still needs at least one photo before it can be published." />
      <SaveBar pending={pending} state={state} />
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {}); useSaved(state);
  const e = state.errors ?? {};
  return (
    <form action={action} className="grid max-w-md gap-4" key={state.ok ? "done" : "form"}>
      <Field name="current" label="Current password" type="password" autoComplete="current-password" required error={e.current} />
      <Field name="next" label="New password" type="password" autoComplete="new-password" required minLength={12} error={e.next} hint="At least 12 characters." />
      <Field name="confirm" label="Confirm new password" type="password" autoComplete="new-password" required error={e.confirm} />
      <SaveBar pending={pending} state={state} />
    </form>
  );
}
