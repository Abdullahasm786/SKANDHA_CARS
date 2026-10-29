import { LogoUploader, SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSiteSettings, missingSettings } from "@/lib/settings";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin();
  const s = await getSiteSettings();
  const todo = missingSettings(s);
  return (
    <div className="grid gap-8">
      <h1 className="display text-4xl">Site settings</h1>
      {todo.length > 0 && <div className="bg-warn-bg p-4 text-sm text-warn"><strong>Incomplete:</strong> {todo.join(" · ")}</div>}
      <LogoUploader logoUrl={s.logo?.header ?? null} />
      <SettingsForm s={s} />
    </div>
  );
}
