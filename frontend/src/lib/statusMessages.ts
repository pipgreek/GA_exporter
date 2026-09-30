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

/**
 * Secondary line shown under the progress bar when nothing has changed for a
 * while, so the UI never looks frozen. It never replaces the real status
 * message and makes no claim about how close the end is.
 */
export const STALL_HINTS = [
  "This step can take a minute. Please keep this page open.",
  "Large agreements take a little longer.",
  "Still working on it...",
];

/** From this progress on, the remaining work is only file generation. */
export const NEAR_END_PROGRESS = 75;

/** Used instead of STALL_HINTS once progress >= NEAR_END_PROGRESS. */
export const NEAR_END_HINTS = ["Almost there, generating your files...", "Still working on it..."];

export const TIMEOUT_MESSAGE =
  "Processing is taking longer than expected. Please try again.";

export const CONNECTION_ERROR_MESSAGE =
  "We lost connection to the server. Please try again.";
