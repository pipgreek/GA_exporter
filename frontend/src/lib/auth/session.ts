/**
 * Shared-password login (decision 8, docs/frontend-notes.md). Server-side only:
 * the password lives in AUTH_PASSWORD (not NEXT_PUBLIC_*), so it is never sent
 * to the browser. Uses Web Crypto only, so it also runs inside proxy.ts.
 *
 * The session is a signed cookie: `v1.<expiry>.<HMAC-SHA256(password, "v1.<expiry>")>`.
 * Changing AUTH_PASSWORD therefore signs everybody out.
 */

const encoder = new TextEncoder();

export const SESSION_COOKIE = "ga_session";
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;
const TOKEN_VERSION = "v1";
const DEFAULT_EMAIL = "info@vilabs.eu";

export interface AuthConfig {
  /** null when AUTH_PASSWORD is missing/empty → nobody can log in. */
  password: string | null;
  /** The one username (email) that can log in, lower-case, e.g. "info@vilabs.eu". */
  email: string;
}

export function getAuthConfig(): AuthConfig {
  const password = process.env.AUTH_PASSWORD;
  const email = (process.env.AUTH_EMAIL ?? "").trim().toLowerCase();
  return {
    password: password ? password : null,
    email: email || DEFAULT_EMAIL,
  };
}

/** Constant-time comparison (no early exit on the first difference). */
function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function sha256(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
}

async function hmacSha256(key: string, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message)));
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * The shared username (AUTH_EMAIL, case-insensitive) + the shared password.
 * Both checks always run, in constant time, so a failure does not reveal which
 * of the two was wrong.
 */
export async function credentialsValid(
  email: string,
  password: string,
  config: AuthConfig,
): Promise<boolean> {
  if (!config.password) return false;
  const normalized = email.trim().toLowerCase();
  const emailOk = equalBytes(await sha256(normalized), await sha256(config.email));
  const passwordOk = equalBytes(await sha256(password), await sha256(config.password));
  return emailOk && passwordOk;
}

export async function createSessionToken(password: string, now = Date.now()): Promise<string> {
  const payload = `${TOKEN_VERSION}.${Math.floor(now / 1000) + SESSION_MAX_AGE_SECONDS}`;
  return `${payload}.${toBase64Url(await hmacSha256(password, payload))}`;
}

export async function verifySessionToken(
  token: string | undefined,
  password: string | null,
  now = Date.now(),
): Promise<boolean> {
  if (!token || !password) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return false;
  const expiresAt = Number(parts[1]);
  if (!Number.isInteger(expiresAt) || expiresAt * 1000 <= now) return false;
  const expected = toBase64Url(await hmacSha256(password, `${parts[0]}.${parts[1]}`));
  return equalBytes(encoder.encode(parts[2]), encoder.encode(expected));
}
