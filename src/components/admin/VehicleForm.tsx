"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createVehicle, updateVehicle, type VehicleResult } from "@/actions/vehicles";
import { Check, Field, Select, TextArea } from "@/components/forms/Field";
import { BODY_TYPES, FUEL_TYPES, TRANSMISSIONS } from "@/lib/validation/vehicle";
import type { Vehicle } from "@/lib/types";
import { label } from "@/lib/utils/format";
import { UploadQueue, uploadFiles } from "./ImageManager";

const opts = (xs: readonly string[]): Array<[string, string]> => xs.map((x) => [x, label(x)]);

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const router = useRouter();
  const [res, setRes] = useState<VehicleResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [jobs, setJobs] = useState<Array<Parameters<typeof UploadQueue>[0]["jobs"][number]>>([]);
  const files = useRef<HTMLInputElement>(null);
  const e = res?.errors ?? {};
  const v = vehicle;

  async function onSubmit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setSaving(true); setRes(null);
    const fd = new FormData(ev.currentTarget);
    const photos = (fd.getAll("photos") as File[]).filter((f) => f.size > 0);
    fd.delete("photos");
    const r = v ? await updateVehicle(v.id, fd) : await createVehicle(fd);
    setRes(r);
    if (r.ok && r.id) {
      if (photos.length) {
        const done = await uploadFiles(r.id, photos, setJobs);
        if (done.some((j) => j.state === "failed")) { setSaving(false); setRes({ ok: true, id: r.id, message: "Saved. Some photos failed — retry them from the edit page." }); router.push(`/admin/cars/${r.id}/edit`); return; }
      }
      if (!v) { router.push(`/admin/cars/${r.id}/edit?created=1`); return; }
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8">
      <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <legend className="display mb-3 text-2xl">Vehicle</legend>
        <Field name="make" label="Make *" defaultValue={v?.make} required error={e.make} />
        <Field name="model" label="Model *" defaultValue={v?.model} required error={e.model} />
        <Field name="variant" label="Variant" defaultValue={v?.variant ?? ""} error={e.variant} />
        <Field name="model_year" label="Model year *" type="number" defaultValue={v?.model_year} required error={e.model_year} />
        <Field name="manufacturing_year" label="Manufacturing year" type="number" defaultValue={v?.manufacturing_year ?? ""} error={e.manufacturing_year} />
        <Field name="price_inr" label="Asking price (₹) *" type="number" min={0} defaultValue={v?.price_inr} required error={e.price_inr} />
        <Select name="negotiable" label="Negotiable?" placeholder="Not specified" defaultValue={v?.negotiable == null ? "" : v.negotiable ? "yes" : "no"} options={[["yes", "Yes"], ["no", "No (fixed price)"]]} />
        <Field name="odometer_km" label="Kilometres driven" type="number" min={0} defaultValue={v?.odometer_km ?? ""} error={e.odometer_km} />
        <Select name="fuel_type" label="Fuel" placeholder="Select…" defaultValue={v?.fuel_type ?? ""} options={opts(FUEL_TYPES)} />
        <Select name="transmission" label="Transmission" placeholder="Select…" defaultValue={v?.transmission ?? ""} options={opts(TRANSMISSIONS)} />
        <Select name="body_type" label="Body type" placeholder="Select…" defaultValue={v?.body_type ?? ""} options={opts(BODY_TYPES)} />
        <Field name="colour" label="Colour" defaultValue={v?.colour ?? ""} />
        <Field name="ownership_count" label="Number of owners" type="number" min={1} defaultValue={v?.ownership_count ?? ""} hint="Only enter if verified." error={e.ownership_count} />
        <Field name="registration_city" label="Registration city" defaultValue={v?.registration_city ?? ""} hint="Do not enter the registration number." />
        <Field name="registration_state" label="Registration state" defaultValue={v?.registration_state ?? ""} />
        <Field name="insurance_expiry" label="Insurance valid until" type="date" defaultValue={v?.insurance_expiry ?? ""} />
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="display mb-3 text-2xl">Details</legend>
        <TextArea name="description" label="Description" defaultValue={v?.description ?? ""} rows={5} />
        <TextArea name="features" label="Features (one per line)" defaultValue={v?.features.join("\n") ?? ""} rows={5} />
        <TextArea name="service_history" label="Service history (only if documented)" defaultValue={v?.service_history ?? ""} />
        <TextArea name="inspection_notes" label="Inspection information (only if documented)" defaultValue={v?.inspection_notes ?? ""} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="display mb-3 text-2xl">Status</legend>
        <Select name="inventory_status" label="Inventory status" defaultValue={v?.inventory_status ?? "available"} options={[["available", "Available"], ["reserved", "Reserved"], ["sold", "Sold"]]} />
        <Select name="publication_status" label="Publication" defaultValue={v?.publication_status ?? "draft"} options={[["draft", "Draft (hidden)"], ["published", "Published"], ["archived", "Archived"]]} />
        <Check name="is_featured" label="Featured on homepage" defaultChecked={v?.is_featured} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="display mb-3 text-2xl">SEO</legend>
        {v && <Field name="slug" label="URL slug" defaultValue={v.slug} error={e.slug} hint="Changing it keeps a permanent redirect from the old URL." className="sm:col-span-2" />}
        <Field name="seo_title" label="SEO title" defaultValue={v?.seo_title ?? ""} maxLength={120} />
        <Field name="seo_description" label="SEO description" defaultValue={v?.seo_description ?? ""} maxLength={320} />
      </fieldset>

      {!v && (
        <div><label className="label" htmlFor="photos-input">Photos</label>
          <input id="photos-input" ref={files} name="photos" type="file" multiple accept="image/jpeg,image/png,image/webp" className="field" />
          <p className="hint">Optional here — uploaded right after the car is saved. You can reorder and add alt text on the next screen.</p>
          <UploadQueue jobs={jobs} onRetry={() => {}} /></div>
      )}

      <div className="flex items-center gap-4">
        <button className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : v ? "Save changes" : "Create car"}</button>
        <p role="status" className={res?.ok ? "text-success text-sm" : "err"}>{res?.ok && !res.message ? "Saved." : res?.message}</p>
      </div>
    </form>
  );
}
