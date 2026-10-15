"use client";

import { Eye, EyeOff, LoaderCircle, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

interface LoginFormProps {
  /** Only emails of this domain are accepted (shown as the placeholder). */
  emailDomain: string;
  /** false when AUTH_PASSWORD is not set on the server → login cannot work. */
  configured: boolean;
}

const INPUT_CLASSES =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:opacity-60";

export function LoginForm({ emailDomain, configured }: LoginFormProps) {
  const router = useRouter();
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    configured ? null : "Login is not configured. Please contact the ViLabs team.",
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !configured) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.replace("/");
        router.refresh();
        return; // keep the button busy while the page changes
      }

      let message = "Login failed. Please try again.";
      try {
        const body = (await res.json()) as { message?: string };
        if (body.message) message = body.message;
      } catch {
        // Non-JSON error body; keep the generic message.
      }
      setError(message);
      if (res.status === 401) {
        setPassword("");
        passwordRef.current?.focus();
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="fade-in mt-32 flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm"
    >
      <h1 className="text-center text-2xl font-extrabold tracking-tight text-slate-900">Login</h1>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-sm font-semibold text-slate-700">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          name="email"
          autoComplete="username"
          inputMode="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`name@${emailDomain}`}
          disabled={submitting || !configured}
          className={INPUT_CLASSES}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="text-sm font-semibold text-slate-700">
          Password
        </label>
        <div className="relative">
          <input
            ref={passwordRef}
            id="login-password"
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting || !configured}
            className={`${INPUT_CLASSES} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            title={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            {showPassword ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !configured || email.trim() === "" || password === ""}
        className="flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-sky-600/20 transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {submitting ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <LogIn className="size-4" aria-hidden />
        )}
        Login
      </button>
    </form>
  );
}
