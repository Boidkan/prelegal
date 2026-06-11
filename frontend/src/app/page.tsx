"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

/**
 * V1 foundation landing page. Deliberately minimal: it confirms the stack is
 * wired together (frontend served by the backend, auth working) and gives the
 * user a way in. Product features arrive in later tickets.
 */
export default function Home() {
  const { user, loading, signout } = useAuth();

  return (
    <div className="flex flex-1 flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">
            Prelegal
          </span>
          <nav className="flex items-center gap-3 text-sm">
            {loading ? null : user ? (
              <>
                <span className="text-brand-gray">{user.email}</span>
                <button
                  type="button"
                  onClick={signout}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="rounded-lg px-3 py-1.5 font-medium text-brand-blue"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-brand-purple px-3 py-1.5 font-semibold text-white transition hover:opacity-90"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-yellow">
          V1 Foundation
        </p>
        <h1 className="mt-3 text-4xl font-bold text-brand-navy sm:text-5xl">
          Draft legal agreements, faster.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-brand-gray">
          Prelegal helps you create agreements from trusted templates. The
          platform foundation is in place — document drafting is coming soon.
        </p>

        <div className="mt-8">
          {loading ? null : user ? (
            <p className="text-sm text-brand-gray">
              You&rsquo;re signed in and ready for what&rsquo;s next.
            </p>
          ) : (
            <Link
              href="/signup"
              className="inline-block rounded-lg bg-brand-purple px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Get started
            </Link>
          )}
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-8 text-center text-xs text-brand-gray">
        Prelegal — V1 foundation
      </footer>
    </div>
  );
}
