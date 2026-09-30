/**
 * The app always talks to the backend at NEXT_PUBLIC_API_URL; there is no demo
 * mode and no automatic fallback (decision 7, docs/frontend-notes.md). Without
 * the variable, the home page shows the "service unavailable" screen.
 *
 * For local UI work without a backend, point it at the built-in mock
 * explicitly: NEXT_PUBLIC_API_URL=http://localhost:3000/api/mock (development
 * only — the mock routes are disabled in production builds).
 *
 * NEXT_PUBLIC_* values are inlined at build time, so changing them requires a rebuild.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "";

/** Set when no backend is configured. */
export const API_CONFIG_ERROR: string | null =
  API_BASE_URL === "" ? "No backend is configured (NEXT_PUBLIC_API_URL is not set)." : null;

/** The /api/mock routes exist only in development (`next dev`). */
export const MOCK_ROUTES_ENABLED = process.env.NODE_ENV !== "production";
