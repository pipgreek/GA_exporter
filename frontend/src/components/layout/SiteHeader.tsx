"use client";

import Image from "next/image";
import { useNavigationGuard } from "./NavigationGuard";

export function SiteHeader() {
  const { goHome } = useNavigationGuard();

  return (
    <header className="absolute left-6 top-6 z-30">
      <button
        type="button"
        onClick={goHome}
        title="Return to Home"
        aria-label="ViLabs — Return to Home"
        className="group block cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      >
        <Image
          src="/vilabs-logo.png"
          alt=""
          width={1200}
          height={542}
          priority
          className="h-20 w-auto drop-shadow-sm transition-transform group-hover:scale-105"
        />
      </button>
    </header>
  );
}
