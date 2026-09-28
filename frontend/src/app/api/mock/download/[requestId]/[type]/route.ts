import type { FileType } from "@/lib/api/types";
import { computeStatus, parseRequestId } from "@/mocks/mockBackend";
import { buildMockFile, fileResponse } from "@/mocks/mockFiles";

const FILE_TYPES: FileType[] = ["info", "gantt", "kpi"];

// Mock of GET /download/{requestId}/{type} — type: info | gantt | kpi
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/mock/download/[requestId]/[type]">,
) {
  const { requestId, type } = await ctx.params;
  const parsed = parseRequestId(requestId);
  if (!parsed) {
    return Response.json({ message: "Unknown requestId." }, { status: 404 });
  }
  if (!FILE_TYPES.includes(type as FileType)) {
    return Response.json({ message: "Unknown file type." }, { status: 404 });
  }
  if (computeStatus(parsed.scenario, parsed.startedAt).status !== "done") {
    return Response.json({ message: "Files are not ready yet." }, { status: 409 });
  }
  return fileResponse(buildMockFile(type as FileType));
}
