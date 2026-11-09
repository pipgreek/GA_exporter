"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useNavigationGuard } from "./NavigationGuard";

const LOGO_CLASSES = "h-20 w-auto drop-shadow-sm";

export function SiteHeader() {
  const { goHome } = useNavigationGuard();
  const pathname = usePathname();

  // The assistant page is a standalone page: the logo there is only a picture, not a link home.
  if (pathname.startsWith("/assistant")) {
    return (
      <header className="absolute left-6 top-6 z-30">
        <Image src="/vilabs-logo.png" alt="ViLabs" width={1200} height={542} priority className={LOGO_CLASSES} />
      </header>
    );
  }

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
          className={`${LOGO_CLASSES} transition-transform group-hover:scale-105`}
        />
      </button>
    </header>
  );
}
