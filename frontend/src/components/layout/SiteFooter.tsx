"use client";

import { ChevronUp } from "lucide-react";
import { useNavigationGuard } from "./NavigationGuard";

export function SiteFooter() {
  const { openPrivacy } = useNavigationGuard();

  return (
    <footer className="relative z-10 mt-20 flex w-full items-center justify-between gap-4 border-t border-slate-800 bg-slate-900 px-6 py-6 text-sm text-slate-400 sm:px-12">
      <div>
        © Copyright {new Date().getFullYear()} ViLabs. All Rights Reserved.{" "}
        <button
          type="button"
          onClick={openPrivacy}
          className="cursor-pointer text-sky-400 hover:underline focus:outline-none focus-visible:underline"
        >
          Privacy Policy
        </button>
      </div>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-slate-800 text-slate-300 shadow transition-all hover:bg-sky-600 hover:text-white"
      >
        <ChevronUp className="size-5" aria-hidden />
      </button>
    </footer>
  );
}
