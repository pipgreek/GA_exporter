import type {
  ApiErrorBody,
  FileType,
  PreviewResponse,
  StatusResponse,
  UploadResponse,
} from "./types";
import { API_BASE_URL, API_CONFIG_ERROR } from "./config";

// Backend URL / configuration check lives in ./config.
export { API_BASE_URL, API_CONFIG_ERROR } from "./config";

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
  if (API_CONFIG_ERROR) throw new ApiError(API_CONFIG_ERROR, 0);

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

/**
 * GET /health — resolves when the backend answers `{ status: "ok" }`.
 * Throws ApiError otherwise (not configured, unreachable, aborted, bad reply).
 */
export async function checkHealth(signal?: AbortSignal): Promise<void> {
  const body = await request<{ status?: string }>("/health", { signal });
  if (body.status !== "ok") throw new ApiError("The server is not healthy.", 503);
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
