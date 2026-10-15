import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { getAuthConfig } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Login — ViLabs",
};

// Read AUTH_* at request time (not baked in at build time).
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const { password } = getAuthConfig();
  return <LoginForm configured={password !== null} />;
}
