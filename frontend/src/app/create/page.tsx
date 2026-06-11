"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { NdaChat } from "@/components/NdaChat";
import { useAuth } from "@/lib/auth";

/**
 * Protected Mutual NDA chat creator. Signed-out users are redirected to sign in.
 */
export default function CreatePage() {
  const { user, loading, signout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="flex flex-1 flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-baseline gap-3">
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue"
            >
              Prelegal
            </Link>
            <span className="text-sm font-medium text-brand-navy">
              Mutual NDA Creator
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-brand-gray">{user.email}</span>
            <button
              type="button"
              onClick={signout}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <NdaChat />
    </div>
  );
}
