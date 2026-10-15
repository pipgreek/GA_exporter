import { NextResponse } from "next/server";
import {
  createSessionToken,
  credentialsValid,
  getAuthConfig,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/session";

const MAX_FIELD_LENGTH = 256;
/** Slows down password guessing; every failed attempt waits this long. */
const FAILED_ATTEMPT_DELAY_MS = 800;

// POST /api/auth/login — { email, password } → sets the session cookie.
export async function POST(request: Request) {
  const config = getAuthConfig();
  if (!config.password) {
    return NextResponse.json(
      { message: "Login is not configured. Please contact the ViLabs team." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email.length > MAX_FIELD_LENGTH || password.length > MAX_FIELD_LENGTH) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  if (!(await credentialsValid(email, password, config))) {
    await new Promise((resolve) => setTimeout(resolve, FAILED_ATTEMPT_DELAY_MS));
    // Same message for a wrong email and a wrong password: do not reveal which one failed.
    return NextResponse.json({ message: "Incorrect email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(config.password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
