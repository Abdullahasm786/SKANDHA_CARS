import { Suspense } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSiteSettings } from "@/lib/settings";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [{ user }, settings] = await Promise.all([requireAdmin(), getSiteSettings()]);
  return (
    <Suspense fallback={null}>
      <AdminShell brandName={settings.brandName} logoUrl={settings.logo?.favicon ?? null} email={user.email} >{children}</AdminShell>
    </Suspense>
  );
}
