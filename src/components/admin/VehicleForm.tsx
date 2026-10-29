"use client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createVehicle, updateVehicle, type VehicleResult } from "@/actions/vehicles";
import { Check, Field, Select, TextArea } from "@/components/forms/Field";
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/validation/vehicle";
import type { Vehicle } from "@/lib/types";
import { label } from "@/lib/utils/format";
import { UploadQueue, uploadFiles } from "./ImageManager";
import { PhotoPicker } from "./PhotoPicker";
import { useToast } from "./Toast";

const opts = (xs: readonly string[]): Array<[string, string]> => xs.map((x) => [x, label(x)]);

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="text-base font-semibold" aria-hidden>{title}</h2>
      {hint && <p className="mb-4 mt-0.5 text-sm text-muted">{hint}</p>}
      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${hint ? "" : "mt-4"}`}>{children}</div>
    </fieldset>
  );
}

export function VehicleForm({ vehicle, defaultPublication = "draft" }: { vehicle?: Vehicle; defaultPublication?: "draft" | "published" }) {
  const router = useRouter();
  const toast = useToast();
  const [res, setRes] = useState<VehicleResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [jobs, setJobs] = useState<Array<Parameters<typeof UploadQueue>[0]["jobs"][number]>>([]);
  const e = res?.errors ?? {};
  const v = vehicle;

  useEffect(() => {
    if (!dirty) return;
    const warn = (ev: BeforeUnloadEvent) => { ev.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (saving) return;
    const form = ev.currentTarget;
    const intent = (ev.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    const fd = new FormData(form);
    fd.delete("photos");
    if (intent === "draft") fd.set("publication_status", "draft");
    if (!v && fd.get("publication_status") === "published" && photos.length === 0) {
      const m = "Add at least one photo before publishing, or save as a draft.";
      setRes({ ok: false, message: m }); toast(false, m); return;
    }
    setSaving(true); setRes(null);
    const r = v ? await updateVehicle(v.id, fd) : await createVehicle(fd);
    setRes(r);
    if (!r.ok || !r.id) { toast(false, r.message ?? "Could not save."); setSaving(false); return; }
    setDirty(false);
    if (!v && photos.length) {
      const done = await uploadFiles(r.id, photos, setJobs);
      if (done.some((j) => j.state === "failed")) {
        toast(false, "Vehicle saved, but some photos failed. Retry them on the next page.");
        router.push(`/admin/cars/${r.id}/edit`); return;
      }
    }
    toast(true, v ? "Changes saved." : "Vehicle created.");
    if (v) { router.refresh(); setSaving(false); } else router.push(`/admin/cars/${r.id}`);
  }

  return (
    <form onSubmit={onSubmit} onChange={() => setDirty(true)} className="grid gap-5">
      {res && !res.ok && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger-bg p-3 text-sm text-danger">{res.message}{res.errors && <ul className="mt-1 list-disc pl-5">{Object.entries(res.errors).map(([k, m]) => <li key={k}>{m}</li>)}</ul>}</div>
      )}

      <Section title="Basic details" hint="The title shown to customers is built from year, make, model and variant.">
        <Field name="make" label="Make *" defaultValue={v?.make} required error={e.make} placeholder="e.g. Hyundai" />
        <Field name="model" label="Model *" defaultValue={v?.model} required error={e.model} placeholder="e.g. i10" />
        <Field name="variant" label="Variant" defaultValue={v?.variant ?? ""} error={e.variant} placeholder="e.g. Magna" />
        <Field name="model_year" label="Model year *" type="number" defaultValue={v?.model_year} required error={e.model_year} />
        <Field name="manufacturing_year" label="Manufacturing year" type="number" defaultValue={v?.manufacturing_year ?? ""} error={e.manufacturing_year} />
        <Field name="colour" label="Colour" defaultValue={v?.colour ?? ""} />
      </Section>

      <Section title="Pricing and condition">
        <Field name="price_inr" label="Selling price (₹) *" type="number" min={0} defaultValue={v?.price_inr} required error={e.price_inr} />
        <Select name="negotiable" label="Negotiable?" placeholder="Not specified" defaultValue={v?.negotiable == null ? "" : v.negotiable ? "yes" : "no"} options={[["yes", "Yes, slightly negotiable"], ["no", "No, fixed price"]]} />
        <Field name="odometer_km" label="Odometer (km)" type="number" min={0} defaultValue={v?.odometer_km ?? ""} error={e.odometer_km} />
        <Field name="ownership_count" label="Number of owners" type="number" min={1} defaultValue={v?.ownership_count ?? ""} hint="Only if verified." error={e.ownership_count} />
        <Field name="insurance_expiry" label="Insurance valid until" type="date" defaultValue={v?.insurance_expiry ?? ""} />
        <Field name="registration_city" label="Registration city" defaultValue={v?.registration_city ?? ""} hint="Never enter the registration number." />
        <Field name="registration_state" label="Registration state" defaultValue={v?.registration_state ?? ""} />
      </Section>

      <Section title="Specifications">
        <Select name="fuel_type" label="Fuel type" placeholder="Select…" defaultValue={v?.fuel_type ?? ""} options={opts(FUEL_TYPES)} />
        <Select name="transmission" label="Transmission" placeholder="Select…" defaultValue={v?.transmission ?? ""} options={opts(TRANSMISSIONS)} />
        <Select name="body_type" label="Body type" placeholder="Select…" defaultValue={v?.body_type ?? ""} options={opts(BODY_TYPES)} />
      </Section>

      <Section title="Photos" hint={v ? "Manage photos in the section below after saving." : "Upload now; they are saved right after the vehicle. The first photo is the cover image."}>
        {v ? <p className="text-sm text-muted sm:col-span-2 lg:col-span-3">Photos for this vehicle are managed in the Photos section under this form.</p> : (
          <div className="sm:col-span-2 lg:col-span-3">
            <PhotoPicker files={photos} onChange={(f) => { setPhotos(f); setDirty(true); }} disabled={saving} />
            <UploadQueue jobs={jobs} onRetry={() => {}} />
          </div>
        )}
      </Section>

      <Section title="Listing description">
        <TextArea name="description" label="Description" defaultValue={v?.description ?? ""} rows={5} className="sm:col-span-2 lg:col-span-3" />
        <TextArea name="features" label="Key features (one per line)" defaultValue={v?.features.join("\n") ?? ""} rows={5} className="sm:col-span-2" />
        <div className="grid gap-4"><TextArea name="service_history" label="Service history (documented)" defaultValue={v?.service_history ?? ""} rows={2} />
          <TextArea name="inspection_notes" label="Inspection notes (documented)" defaultValue={v?.inspection_notes ?? ""} rows={2} /></div>
      </Section>

      <Section title="Publication">
        <Select name="inventory_status" label="Inventory status" defaultValue={v?.inventory_status ?? "available"} options={[["available", "Available"], ["reserved", "Reserved"], ["sold", "Sold"]]} hint="Use the Actions menu to change status with confirmation." />
        <Select name="publication_status" label="Visibility" defaultValue={v?.publication_status ?? defaultPublication} options={[["draft", "Draft — hidden from customers"], ["published", "Published — visible on website"], ["archived", "Archived — hidden"]]} />
        <Check name="is_featured" label="Feature on homepage" defaultChecked={v?.is_featured} hint="Shown only while published and available." className="pt-6" />
        {v && <Field name="slug" label="URL slug" defaultValue={v.slug} error={e.slug} hint="Changing it keeps a permanent redirect from the old address." className="sm:col-span-2" />}
        <Field name="seo_title" label="SEO title" defaultValue={v?.seo_title ?? ""} maxLength={120} />
        <Field name="seo_description" label="SEO description" defaultValue={v?.seo_description ?? ""} maxLength={320} className="sm:col-span-2" />
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:left-[264px]" style={{ paddingBottom: "max(.75rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-end gap-2 sm:px-2">
          <p className="mr-auto text-xs text-muted" role="status">{saving ? "Saving…" : dirty ? "Unsaved changes" : "All changes saved"}</p>
          <Link href={v ? `/admin/cars/${v.id}` : "/admin/cars"} className="btn">Cancel</Link>
          {!v && <button name="intent" value="draft" className="btn" disabled={saving}>Save draft</button>}
          <button name="intent" value="save" className="btn btn-primary" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" aria-hidden />}{v ? "Save changes" : "Save vehicle"}</button>
        </div>
      </div>
    </form>
  );
}
