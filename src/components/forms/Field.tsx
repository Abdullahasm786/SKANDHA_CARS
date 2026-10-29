import { cn } from "@/lib/utils/format";

type Common = { name: string; label: string; error?: string; hint?: string; className?: string };

export function Field({ name, label, error, hint, className, ...rest }: Common & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} className="field" aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-e` : hint ? `${name}-h` : undefined} {...rest} />
      {hint && !error && <p id={`${name}-h`} className="hint">{hint}</p>}
      {error && <p id={`${name}-e`} role="alert" className="err">{error}</p>}
    </div>
  );
}

export function TextArea({ name, label, error, hint, className, ...rest }: Common & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <textarea id={name} name={name} rows={4} className="field" aria-invalid={Boolean(error)} {...rest} />
      {hint && !error && <p className="hint">{hint}</p>}
      {error && <p role="alert" className="err">{error}</p>}
    </div>
  );
}

export function Select({ name, label, error, hint, className, options, placeholder, ...rest }: Common & React.SelectHTMLAttributes<HTMLSelectElement> & { options: Array<[string, string]>; placeholder?: string }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <select id={name} name={name} className="field" aria-invalid={Boolean(error)} {...rest}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {hint && !error && <p className="hint">{hint}</p>}
      {error && <p role="alert" className="err">{error}</p>}
    </div>
  );
}

export function Check({ name, label, defaultChecked, hint, className }: { name: string; label: string; defaultChecked?: boolean; hint?: string; className?: string }) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input id={name} name={name} type="checkbox" defaultChecked={defaultChecked} className="mt-1 h-5 w-5 accent-[var(--accent)]" />
      <label htmlFor={name} className="text-sm"><span className="font-semibold">{label}</span>{hint && <span className="hint block">{hint}</span>}</label>
    </div>
  );
}
