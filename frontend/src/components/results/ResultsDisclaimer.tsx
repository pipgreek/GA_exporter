import { Info } from "lucide-react";

/** Small, discreet reminder that the generated files are automatic and must be validated. */
export function ResultsDisclaimer() {
  return (
    <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
      <Info className="size-3.5 shrink-0" aria-hidden />
      <span>
        This application can make mistakes. Please review and validate the results before using them.
      </span>
    </p>
  );
}
