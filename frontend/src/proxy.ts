import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth/redirect";
import { getAuthConfig, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/** Reachable without logging in (Next.js 16 "proxy", formerly middleware). */
// /mcp has no login cookie by design: the backend requires its own bearer token there.
const PUBLIC_PATHS = ["/login", "/privacy", "/mcp"];

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
    return NextResponse.redirect(new URL(safeNextPath(request.nextUrl.searchParams.get("next")), request.url));
  }
  if (isPublic(pathname) || authenticated) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }
  // Remember the page the visitor asked for, so the login can send them back to it.
  const loginUrl = new URL("/login", request.url);
  const target = pathname + request.nextUrl.search;
  if (target !== "/") loginUrl.searchParams.set("next", target);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except Next.js internals and static files from /public (logo, favicon…).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"],
};
