import { z } from "zod";

/** Empty form fields arrive as "" — treat them as absent. */
export const emptyToUndef = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const optText = (max = 2000) => z.preprocess(emptyToUndef, z.string().trim().max(max).optional());
export const optInt = (min: number, max: number) =>
  z.preprocess(emptyToUndef, z.coerce.number().int().min(min).max(max).optional());
export const optUrl = z.preprocess(
  emptyToUndef,
  z.string().trim().url().regex(/^https?:\/\//, "Must start with http:// or https://").max(500).optional(),
);

export function formToObject(fd: FormData): Record<string, FormDataEntryValue | FormDataEntryValue[]> {
  const out: Record<string, FormDataEntryValue | FormDataEntryValue[]> = {};
  for (const key of new Set(fd.keys())) {
    const all = fd.getAll(key);
    out[key] = all.length > 1 ? all : all[0];
  }
  return out;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const k = String(issue.path[0] ?? "form");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

export type ActionState = { ok?: boolean; message?: string; errors?: Record<string, string> };
