import Image from "next/image";
import Link from "next/link";

// TODO(home-page step): ask for confirmation before leaving when a file is uploaded.
export function SiteHeader() {
  return (
    <header className="absolute left-6 top-6 z-30">
      <Link href="/" title="Return to Home" className="group block">
        <Image
          src="/vilabs-logo.png"
          alt="ViLabs"
          width={1200}
          height={542}
          priority
          className="h-20 w-auto drop-shadow-sm transition-transform group-hover:scale-105"
        />
      </Link>
    </header>
  );
}
