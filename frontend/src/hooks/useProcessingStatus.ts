"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { ApiError, getStatus } from "@/lib/api/client";
import type { ProcessingStatus } from "@/lib/api/types";
import {
  CONNECTION_ERROR_MESSAGE,
  NEAR_END_HINTS,
  NEAR_END_PROGRESS,
  STALL_HINTS,
  STATUS_MESSAGES,
  TIMEOUT_MESSAGE,
} from "@/lib/statusMessages";

export const POLL_INTERVAL_MS = 2500;
/** No change in status/progress for this long → show a reassuring hint line. */
export const STALL_HINT_AFTER_MS = 20_000;
/** The hint changes at most this often. */
export const HINT_ROTATION_MS = 12_000;
// 90s was too tight: real backend runs (PDF parse + 3 parallel LLM calls +
// document generation) measured 2026-09-30 range from ~40s (small GA) to
// ~90-100s (larger GA / slower system load) - the frontend timed out and
// showed an error once even though the backend went on to finish
// successfully seconds later. 150s gives real runs headroom.
export const MAX_WAIT_MS = 150_000;
/** Transient network errors tolerated before giving up. */
const MAX_CONSECUTIVE_POLL_FAILURES = 3;

export interface ProcessingView {
  status: ProcessingStatus;
  /** 0–100 */
  progress: number;
  /** The backend's current status message; always shown as is. */
  message: string;
  /** Optional secondary line, only while progress has stalled for a while. */
  hint: string | null;
}

interface Handlers {
  onDone: () => void;
  onError: (message: string) => void;
}

/** Picks the hint for how long progress has been unchanged (null while it is recent). */
function hintFor(progress: number, stalledForMs: number): string | null {
  if (stalledForMs < STALL_HINT_AFTER_MS) return null;
  const pool = progress >= NEAR_END_PROGRESS ? NEAR_END_HINTS : STALL_HINTS;
  const step = Math.floor((stalledForMs - STALL_HINT_AFTER_MS) / HINT_ROTATION_MS);
  return pool[step % pool.length];
}

/**
 * Polls GET /status/{requestId} until the backend reports done/error.
 *
 * - Polls every 2.5s; the first poll runs immediately.
 * - The real status message is always returned unchanged. If neither the status
 *   nor the progress has changed for 20s, `hint` carries a secondary line that
 *   changes every 12s (it never claims the end is near before the last step).
 * - Gives up with an error after 150s without "done", or after 3 consecutive
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
    hint: null,
  });

  const notifyDone = useEffectEvent(() => handlers.onDone());
  const notifyError = useEffectEvent((message: string) => handlers.onError(message));

  useEffect(() => {
    let stopped = false;
    let failures = 0;
    /** status:progress of the last poll, and when it last changed. */
    let lastKey = "";
    let changedAt = Date.now();

    const stop = () => {
      stopped = true;
      clearInterval(poll);
      clearTimeout(timeout);
    };

    const fail = (message: string) => {
      stop();
      setView((v) => ({ ...v, status: "error", message, hint: null }));
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
          setView({ status: "done", progress: 100, message: res.message || STATUS_MESSAGES.done, hint: null });
          notifyDone();
          return;
        }

        const progress = Math.max(0, Math.min(100, Math.round(res.progress)));
        const key = `${res.status}:${progress}`;
        if (key !== lastKey) {
          lastKey = key;
          changedAt = Date.now();
        }
        setView({
          status: res.status,
          progress,
          message: res.message || STATUS_MESSAGES[res.status],
          hint: hintFor(progress, Date.now() - changedAt),
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

  return view;
}
