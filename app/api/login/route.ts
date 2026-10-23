import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, ACCESS_MAX_AGE, roleForPassword, safeNext, tokenFor } from "@/lib/access";

// Failed attempts per client, in memory — fine for one Railway instance.
const MAX_FAILURES = 10;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; until: number }>();

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}

// A plain form POST (works without JS), answered with a 303 back to a page.
const seeOther = (location: string) => new NextResponse(null, { status: 303, headers: { Location: location } });

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? ""));
  const backToLogin = (error: string) =>
    seeOther(`/login?error=${error}${next ? `&next=${encodeURIComponent(next)}` : ""}`);

  const key = clientKey(request);
  const now = Date.now();
  for (const [k, v] of failures) if (v.until < now) failures.delete(k);
  const record = failures.get(key);
  if (record && record.count >= MAX_FAILURES) return backToLogin("wait");

  const role = password ? await roleForPassword(password) : null;
  if (!role) {
    failures.set(key, { count: (record?.count ?? 0) + 1, until: record?.until ?? now + WINDOW_MS });
    return backToLogin("wrong");
  }
  failures.delete(key);

  // A student password always lands on the student site.
  const destination =
    role === "student" ? (next?.startsWith("/student") ? next : "/student") : (next ?? "/");

  const response = seeOther(destination);
  response.cookies.set(ACCESS_COOKIE, await tokenFor(role), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  return response;
}
