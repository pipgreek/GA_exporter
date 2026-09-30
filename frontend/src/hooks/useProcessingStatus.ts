"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { ApiError, getStatus } from "@/lib/api/client";
import type { ProcessingStatus } from "@/lib/api/types";
import {
  CONNECTION_ERROR_MESSAGE,
  NEAR_END_MESSAGES,
  NEAR_END_PROGRESS,
  STALL_MESSAGES,
  STATUS_MESSAGES,
  TIMEOUT_MESSAGE,
} from "@/lib/statusMessages";

export const POLL_INTERVAL_MS = 2500;
/** No change in status/progress for this long → our own messages join the line. */
export const STALL_AFTER_MS = 10_000;
/** While stalled, the displayed message changes at most this often. */
export const MESSAGE_ROTATION_MS = 12_000;
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
  /** The single line shown next to the percentage. */
  message: string;
}

interface Handlers {
  onDone: () => void;
  onError: (message: string) => void;
}

/**
 * The line to display. Normally the backend's own message. If nothing has
 * changed for STALL_AFTER_MS, our messages take turns on the same line, and
 * the backend's message comes back at the end of each cycle.
 */
function displayMessage(backendMessage: string, progress: number, stalledForMs: number): string {
  if (stalledForMs < STALL_AFTER_MS) return backendMessage;
  const ours = progress >= NEAR_END_PROGRESS ? NEAR_END_MESSAGES : STALL_MESSAGES;
  const cycle = [...ours, backendMessage];
  const step = Math.floor((stalledForMs - STALL_AFTER_MS) / MESSAGE_ROTATION_MS);
  return cycle[step % cycle.length];
}

/**
 * Polls GET /status/{requestId} until the backend reports done/error.
 *
 * - Polls every 2.5s; the first poll runs immediately.
 * - Shows the backend's message. If neither status nor progress changes for
 *   10s, our own messages alternate with it on the same line (every 12s).
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
          setView({ status: "done", progress: 100, message: res.message || STATUS_MESSAGES.done });
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
          message: displayMessage(res.message || STATUS_MESSAGES[res.status], progress, Date.now() - changedAt),
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
