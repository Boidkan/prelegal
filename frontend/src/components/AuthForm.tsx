"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";

type Mode = "signin" | "signup";

const COPY: Record<
  Mode,
  { title: string; submit: string; altPrompt: string; altHref: string; altLabel: string }
> = {
  signin: {
    title: "Sign in",
    submit: "Sign in",
    altPrompt: "Don't have an account?",
    altHref: "/signup",
    altLabel: "Create one",
  },
  signup: {
    title: "Create your account",
    submit: "Sign up",
    altPrompt: "Already have an account?",
    altHref: "/signin",
    altLabel: "Sign in",
  },
};

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30";

/**
 * Shared email/password form for both sign in and sign up. On success it sends
 * the user to the landing page, which reflects the authenticated state.
 */
export function AuthForm({
  mode,
  onSubmit,
}: {
  mode: Mode;
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const router = useRouter();
  const copy = COPY[mode];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(email, password);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Try again.",
      );
    } finally {
      // Reset even on success: client-side navigation keeps this mounted.
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-100 px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue"
        >
          Prelegal
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-brand-navy">{copy.title}</h1>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </label>

          {mode === "signup" && (
            <p className="text-xs text-brand-gray">At least 8 characters.</p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-brand-purple px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Please wait…" : copy.submit}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-gray">
          {copy.altPrompt}{" "}
          <Link href={copy.altHref} className="font-medium text-brand-blue">
            {copy.altLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
