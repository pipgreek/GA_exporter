import { MOCK_API_ALLOWED } from "@/lib/api/config";

/**
 * Returns a 404 when the mock backend is disabled (production build without
 * NEXT_PUBLIC_USE_MOCK_API=true), so /api/mock/* is not reachable in production.
 * Usage in a route handler: `const blocked = mockDisabled(); if (blocked) return blocked;`
 */
export function mockDisabled(): Response | null {
  if (MOCK_API_ALLOWED) return null;
  return Response.json({ message: "Not found." }, { status: 404 });
}
