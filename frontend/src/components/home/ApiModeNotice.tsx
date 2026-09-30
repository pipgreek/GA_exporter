import { FlaskConical, TriangleAlert } from "lucide-react";
import { API_CONFIG_ERROR, isMockApi } from "@/lib/api/config";

/**
 * Makes the backend mode visible: an error when a production build has no
 * backend configured, and a note when the simulated (mock) backend is in use.
 */
export function ApiModeNotice() {
  if (API_CONFIG_ERROR) {
    return (
      <div
        role="alert"
        className="mb-8 flex max-w-xl items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 shadow-sm"
      >
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
        <p>{API_CONFIG_ERROR}</p>
      </div>
    );
  }

  if (isMockApi) {
    return (
      <p className="-mt-4 mb-6 flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
        <FlaskConical className="size-3.5" aria-hidden />
        Demo mode: simulated backend, files contain sample data
      </p>
    );
  }

  return null;
}
