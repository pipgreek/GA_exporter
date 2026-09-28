import { computeStatus, parseRequestId } from "@/mocks/mockBackend";
import { buildMockZip, fileResponse } from "@/mocks/mockFiles";

// Mock of GET /download-all/{requestId} — .zip with the three files.
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/mock/download-all/[requestId]">,
) {
  const { requestId } = await ctx.params;
  const parsed = parseRequestId(requestId);
  if (!parsed) {
    return Response.json({ message: "Unknown requestId." }, { status: 404 });
  }
  if (computeStatus(parsed.scenario, parsed.startedAt).status !== "done") {
    return Response.json({ message: "Files are not ready yet." }, { status: 409 });
  }
  return fileResponse(buildMockZip());
}
