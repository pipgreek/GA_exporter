"use client";

import { CircleAlert } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface Toast {
  id: number;
  message: string;
}

const TOAST_DURATION_MS = 3500;

/** Minimal error-toast state (top-right, auto-dismiss), as in the UI/UX mockup. */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const showError = useCallback((message: string) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((toast) => toast.id !== id)), TOAST_DURATION_MS);
  }, []);

  return { toasts, showError };
}

export function Toaster({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-3 sm:right-6 sm:top-6"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="fade-in pointer-events-auto flex items-center gap-3 rounded-xl border border-rose-500 bg-rose-600 px-4 py-3 text-sm text-white shadow-xl"
        >
          <CircleAlert className="size-4 shrink-0" aria-hidden />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
