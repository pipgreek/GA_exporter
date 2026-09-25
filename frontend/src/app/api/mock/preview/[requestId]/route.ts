import { computeStatus, MOCK_PREVIEW, parseRequestId } from "@/mocks/mockBackend";

// Mock of GET /preview/{requestId} — only available once processing is done.
export async function GET(_request: Request, ctx: RouteContext<"/api/mock/preview/[requestId]">) {
  const { requestId } = await ctx.params;
  const parsed = parseRequestId(requestId);
  if (!parsed) {
    return Response.json({ message: "Unknown requestId." }, { status: 404 });
  }
  if (computeStatus(parsed.scenario, parsed.startedAt).status !== "done") {
    return Response.json({ message: "Preview is not ready yet." }, { status: 409 });
  }
  // "preview-error" scenario: fails until 20s after upload, so Retry succeeds afterwards.
  if (parsed.scenario === "previewerror" && Date.now() - parsed.startedAt < 20_000) {
    return Response.json({ message: "Simulated server error while building the previews." }, { status: 500 });
  }
  return Response.json(MOCK_PREVIEW);
}
