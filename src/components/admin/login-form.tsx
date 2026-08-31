"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mountain, Lock } from "lucide-react";
import { loginAction } from "@/lib/actions/auth";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    if (result && "error" in result) {
      setError(result.error as string);
      setLoading(false);
    } else {
      router.push("/admin/dashboard");
      router.refresh();
    }
  }

  const inputClass =
    "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand";

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white">
            <Mountain className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">Roamora Admin</h1>
          <p className="mt-1 text-sm text-ink-muted">Sign in to manage your content</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 rounded-3xl border border-line bg-white p-8 shadow-sm">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-ink-soft">
              Email
            </label>
            <input id="login-email" name="email" type="email" required className={inputClass} placeholder="you@roamora.com" autoComplete="email" />
          </div>
          <div className="mt-4">
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-ink-soft">
              Password
            </label>
            <input id="login-password" name="password" type="password" required className={inputClass} placeholder="••••••••" autoComplete="current-password" />
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:opacity-60"
          >
            <Lock className="h-4 w-4" aria-hidden />
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}