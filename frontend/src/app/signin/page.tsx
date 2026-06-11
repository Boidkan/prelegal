"use client";

import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
  const { signin } = useAuth();
  return <AuthForm mode="signin" onSubmit={signin} />;
}
