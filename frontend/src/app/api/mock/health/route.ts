import { mockDisabled } from "@/mocks/mockGuard";

// Mock of GET /health (backend: backend/src/health/health.module.ts).
export async function GET() {
  const blocked = mockDisabled();
  if (blocked) return blocked;

  return Response.json({ status: "ok" });
}
