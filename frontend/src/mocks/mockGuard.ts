import { MOCK_ROUTES_ENABLED } from "@/lib/api/config";

/**
 * Returns a 404 in production builds, so /api/mock/* is only reachable during
 * local development (`next dev`).
 * Usage in a route handler: `const blocked = mockDisabled(); if (blocked) return blocked;`
 */
export function mockDisabled(): Response | null {
  if (MOCK_ROUTES_ENABLED) return null;
  return Response.json({ message: "Not found." }, { status: 404 });
}
