import type {
  ApiErrorBody,
  FileType,
  PreviewResponse,
  StatusResponse,
  UploadResponse,
} from "./types";

/**
 * Base URL of the backend. When NEXT_PUBLIC_API_URL is not set, the app talks to
 * the built-in mock backend (src/app/api/mock), so the UI can be developed and
 * tested before the real backend exists. Switching to the real backend only
 * requires setting the env var — no code changes.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "/api/mock";

export const isMockApi = !process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store", ...init });
  } catch {
    throw new ApiError("Could not reach the server. Please try again.", 0);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as Partial<ApiErrorBody>;
      if (body.message) message = body.message;
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
}

/** POST /upload — sends the Grant Agreement PDF as multipart/form-data. */
export function uploadGrantAgreement(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return request<UploadResponse>("/upload", { method: "POST", body: formData });
}

/** GET /status/{requestId} */
export function getStatus(requestId: string): Promise<StatusResponse> {
  return request<StatusResponse>(`/status/${encodeURIComponent(requestId)}`);
}

/** GET /preview/{requestId} */
export function getPreview(requestId: string): Promise<PreviewResponse> {
  return request<PreviewResponse>(`/preview/${encodeURIComponent(requestId)}`);
}

/** URL for <a href download> — GET /download/{requestId}/{type} */
export function getDownloadUrl(requestId: string, type: FileType): string {
  return `${API_BASE_URL}/download/${encodeURIComponent(requestId)}/${type}`;
}

/** URL for <a href download> — GET /download-all/{requestId} */
export function getDownloadAllUrl(requestId: string): string {
  return `${API_BASE_URL}/download-all/${encodeURIComponent(requestId)}`;
}
