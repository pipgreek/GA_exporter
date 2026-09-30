import { mockDisabled } from "@/mocks/mockGuard";
import { createRequestId, scenarioFromFileName } from "@/mocks/mockBackend";
import { MAX_PDF_UPLOAD_BYTES } from "@/lib/files";

// Mock of POST /upload — accepts a single PDF as multipart/form-data.
export async function POST(request: Request) {
  const blocked = mockDisabled();
  if (blocked) return blocked;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ message: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ message: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_PDF_UPLOAD_BYTES) {
    return Response.json({ message: "PDF files must be 25 MiB or smaller." }, { status: 413 });
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return Response.json({ message: "Only PDF files are accepted." }, { status: 400 });
  }

  const requestId = createRequestId(scenarioFromFileName(file.name));
  return Response.json({ requestId });
}
