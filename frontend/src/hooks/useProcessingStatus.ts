"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { ApiError, getStatus } from "@/lib/api/client";
import type { ProcessingStatus } from "@/lib/api/types";
import {
  CONNECTION_ERROR_MESSAGE,
  FALLBACK_MESSAGES,
  STATUS_MESSAGES,
  TIMEOUT_MESSAGE,
} from "@/lib/statusMessages";

export const POLL_INTERVAL_MS = 2500;
export const FALLBACK_ROTATION_MS = 2500;
export const MAX_WAIT_MS = 90_000;
/** Transient network errors tolerated before giving up. */
const MAX_CONSECUTIVE_POLL_FAILURES = 3;

export interface ProcessingView {
  status: ProcessingStatus;
  /** 0–100 */
  progress: number;
  message: string;
}

interface Handlers {
  onDone: () => void;
  onError: (message: string) => void;
}

/**
 * Polls GET /status/{requestId} until the backend reports done/error.
 *
 * - Polls every 2.5s; the first poll runs immediately.
 * - If two consecutive polls return the same status, rotates fallback
 *   messages ("Almost there..." etc.) until the status changes.
 * - Gives up with an error after 90s without "done", or after 3 consecutive
 *   failed requests.
 *
 * Mount the consuming component with `key={requestId}` so each request starts
 * from a clean state.
 */
export function useProcessingStatus(requestId: string, handlers: Handlers): ProcessingView {
  const [view, setView] = useState<ProcessingView>({
    status: "scanning",
    progress: 0,
    message: STATUS_MESSAGES.scanning,
  });
  const [stalled, setStalled] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const notifyDone = useEffectEvent(() => handlers.onDone());
  const notifyError = useEffectEvent((message: string) => handlers.onError(message));

  useEffect(() => {
    let stopped = false;
    let lastStatus: ProcessingStatus | null = null;
    let failures = 0;
    let rotation: ReturnType<typeof setInterval> | undefined;

    const stopRotation = () => {
      clearInterval(rotation);
      rotation = undefined;
    };

    const stop = () => {
      stopped = true;
      clearInterval(poll);
      clearTimeout(timeout);
      stopRotation();
    };

    const fail = (message: string) => {
      stop();
      setStalled(false);
      setView((v) => ({ ...v, status: "error", message }));
      notifyError(message);
    };

    const tick = async () => {
      try {
        const res = await getStatus(requestId);
        if (stopped) return;
        failures = 0;

        if (res.status === "error") {
          fail(res.message || STATUS_MESSAGES.error);
          return;
        }
        if (res.status === "done") {
          stop();
          setStalled(false);
          setView({ status: "done", progress: 100, message: STATUS_MESSAGES.done });
          notifyDone();
          return;
        }

        const sameAsBefore = res.status === lastStatus;
        lastStatus = res.status;
        if (sameAsBefore && !rotation) {
          rotation = setInterval(() => setFallbackIndex((i) => i + 1), FALLBACK_ROTATION_MS);
        } else if (!sameAsBefore) {
          stopRotation();
        }
        setStalled(sameAsBefore);
        setView({
          status: res.status,
          progress: Math.max(0, Math.min(100, Math.round(res.progress))),
          message: STATUS_MESSAGES[res.status],
        });
      } catch (err) {
        if (stopped) return;
        failures += 1;
        if (failures >= MAX_CONSECUTIVE_POLL_FAILURES) {
          fail(err instanceof ApiError && err.status !== 0 ? err.message : CONNECTION_ERROR_MESSAGE);
        }
      }
    };

    const poll = setInterval(tick, POLL_INTERVAL_MS);
    const timeout = setTimeout(() => fail(TIMEOUT_MESSAGE), MAX_WAIT_MS);
    void tick();

    return stop;
  }, [requestId]);

  if (stalled) {
    return { ...view, message: FALLBACK_MESSAGES[fallbackIndex % FALLBACK_MESSAGES.length] };
  }
  return view;
}
