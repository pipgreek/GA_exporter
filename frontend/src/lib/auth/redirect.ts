/**
 * Where to go after login. `next` comes from the URL, so it is untrusted: only a path inside
 * this app is accepted (starts with a single "/", no scheme/host, not the login page or an API
 * route); anything else falls back to the home page.
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  if (next === "/login" || next.startsWith("/login?") || next.startsWith("/api/")) return "/";
  return next;
}
