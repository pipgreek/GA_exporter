import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { getAuthConfig } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Login — ViLabs",
};

// Read AUTH_* at request time (not baked in at build time).
export const dynamic = "force-dynamic";

export default function LoginPage() {
  const { password, email } = getAuthConfig();
  // Only the domain is used as a hint; the username itself is never sent to the page.
  const emailDomain = email.split("@")[1] ?? "vilabs.eu";
  return <LoginForm emailDomain={emailDomain} configured={password !== null} />;
}
