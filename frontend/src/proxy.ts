import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/** Reachable without logging in (Next.js 16 "proxy", formerly middleware). */
const PUBLIC_PATHS = ["/login", "/privacy"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/auth/");
}

/**
 * Login gate (decision 8, docs/frontend-notes.md): every page needs a valid
 * session cookie, otherwise the visitor is sent to /login. If AUTH_PASSWORD is
 * not configured nobody has a valid session, so everything stays locked.
 *
 * Note: this protects the Next.js app only. The backend API is called directly
 * from the browser and is not behind this gate.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { password } = getAuthConfig();
  const authenticated = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value, password);

  if (pathname === "/login" && authenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (isPublic(pathname) || authenticated) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Everything except Next.js internals and static files from /public (logo, favicon…).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"],
};
