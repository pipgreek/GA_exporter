"use client";

import { LoaderCircle, RotateCcw, ServerCrash } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { API_CONFIG_ERROR, checkHealth } from "@/lib/api/client";

/** Render's free tier can take close to a minute to wake up after idling. */
const HEALTH_TIMEOUT_MS = 60_000;
/** After this long, explain that the server may be starting up. */
const SLOW_AFTER_MS = 5_000;

type GateState = "checking" | "ok" | "down";

/**
 * Checks GET /health when the page opens. Shows the app only when the backend
 * answers; otherwise a "Service unavailable" screen, as if the system were down
 * (decision 7, docs/frontend-notes.md).
 */
export function BackendGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GateState>("checking");
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const slowTimer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    checkHealth(controller.signal)
      .then(() => {
        if (!cancelled) setState("ok");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Details for whoever deploys/debugs; users only see the generic screen.
        console.warn("Backend health check failed:", API_CONFIG_ERROR ?? err);
        setState("down");
      })
      .finally(() => clearTimeout(slowTimer));

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
      clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  function retry() {
    setSlow(false);
    setState("checking");
    setAttempt((a) => a + 1);
  }

  if (state === "ok") return <>{children}</>;

  if (state === "checking") {
    return (
      <div className="fade-in mt-40 flex flex-col items-center gap-3 text-center" aria-busy="true">
        <LoaderCircle className="size-8 animate-spin text-sky-600" aria-hidden />
        <p className="font-semibold text-slate-700">Connecting to the server...</p>
        {slow && (
          <p className="max-w-sm text-sm text-slate-500">
            The server is starting up. This can take up to a minute.
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="fade-in mt-32 flex w-full max-w-lg flex-col items-center rounded-2xl border border-rose-200 bg-white px-6 py-10 text-center shadow-sm"
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <ServerCrash className="size-7" aria-hidden />
      </div>
      <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">Service unavailable</h1>
      <p className="mb-6 text-sm leading-relaxed text-slate-600">
        We can&rsquo;t connect to the Grant Agreement service right now. Please try again in a few
        minutes. If the problem persists, contact{" "}
        <a href="mailto:info@vilabs.eu" className="text-sky-600 hover:underline">
          info@vilabs.eu
        </a>
        .
      </p>
      <button
        type="button"
        onClick={retry}
        className="flex cursor-pointer items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-sky-600/20 transition-all hover:bg-sky-700"
      >
        <RotateCcw className="size-4" aria-hidden /> Try again
      </button>
    </div>
  );
}
