import type { ProcessingStatus } from "@/lib/api/types";

/** UI message per processing status (docs/frontend-notes.md → «Αποφάσεις»). */
export const STATUS_MESSAGES: Record<ProcessingStatus, string> = {
  scanning: "Scanning Grant Agreement...",
  extracting: "Extracting text and structure...",
  analyzing: "Analyzing Work Packages and KPIs...",
  generating: "Generating files...",
  done: "Files generated successfully.",
  error: "Something went wrong while processing your Grant Agreement.",
};

/** Rotated while the status stays the same, so the UI never looks frozen. */
export const FALLBACK_MESSAGES = [
  "Still working on it...",
  "Large agreements take a little longer...",
  "Almost there...",
  "Putting the finishing touches...",
];

export const TIMEOUT_MESSAGE =
  "Processing is taking longer than expected. Please try again.";

export const CONNECTION_ERROR_MESSAGE =
  "We lost connection to the server. Please try again.";
