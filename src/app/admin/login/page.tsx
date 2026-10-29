import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-sm px-4 py-20">
      <h1 className="display text-4xl">Admin sign in</h1>
      <p className="mt-2 text-sm text-muted">Authorized administrators only.</p>
      {error === "forbidden" && <p role="alert" className="mt-4 bg-danger-bg p-3 text-sm text-danger">This account does not have admin access.</p>}
      <LoginForm />
    </main>
  );
}
