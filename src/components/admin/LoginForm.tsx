"use client";
import { useActionState } from "react";
import { login } from "@/actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mt-6 grid gap-4">
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required className="field" /></div>
      <div><label className="label" htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required className="field" /></div>
      {state.message && <p role="alert" className="err">{state.message}</p>}
      <button className="btn btn-primary" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
