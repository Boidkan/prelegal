"use client";

import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/lib/auth";

export default function SignUpPage() {
  const { signup } = useAuth();
  return <AuthForm mode="signup" onSubmit={signup} />;
}
