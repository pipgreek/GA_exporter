import { computeStatus, parseRequestId } from "@/mocks/mockBackend";

// Mock of GET /status/{requestId}
export async function GET(_request: Request, ctx: RouteContext<"/api/mock/status/[requestId]">) {
  const { requestId } = await ctx.params;
  const parsed = parseRequestId(requestId);
  if (!parsed) {
    return Response.json({ message: "Unknown requestId." }, { status: 404 });
  }
  return Response.json(computeStatus(parsed.scenario, parsed.startedAt));
}
