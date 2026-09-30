/**
 * Which backend the app talks to.
 *
 * - NEXT_PUBLIC_API_URL set          → the real backend.
 * - not set, development (next dev)  → the built-in mock backend (/api/mock).
 * - not set, production build        → nothing: the mock is disabled so a
 *   deployment with a missing env var can never silently show sample data.
 *   Set NEXT_PUBLIC_USE_MOCK_API=true to deploy the mock on purpose (demo).
 *
 * NEXT_PUBLIC_* values are inlined at build time, so changing them requires a rebuild.
 */

const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "";

/** Whether the mock backend may be used at all (also guards the /api/mock routes). */
export const MOCK_API_ALLOWED =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

export const isMockApi = !apiUrl && MOCK_API_ALLOWED;

/** Base URL for API calls; empty when the deployment is misconfigured. */
export const API_BASE_URL = apiUrl || (MOCK_API_ALLOWED ? "/api/mock" : "");

/** Set when a production build has no backend configured. */
export const API_CONFIG_ERROR: string | null =
  API_BASE_URL === ""
    ? "This application is not connected to a server yet. Please contact the ViLabs team."
    : null;
