// Shared-password gate. Two passwords, two roles:
// - ANNOTATOR_PASSWORD ("expert") opens everything, both sites.
// - STUDENT_PASSWORD ("student", optional) opens only the student site at
//   `/student` and the API calls it makes.
// Entering one sets a cookie holding the role plus an HMAC of it keyed by
// that role's password, so changing a password signs everyone using it out.
// Used by both `proxy.ts` and `/api/login`.

export type AccessRole = "expert" | "student";

export const ACCESS_COOKIE = "cap_access";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function passwordFor(role: AccessRole): string | undefined {
  return (role === "expert" ? process.env.ANNOTATOR_PASSWORD : process.env.STUDENT_PASSWORD) || undefined;
}

// "open": no password configured in development, so local work is unchanged.
// "misconfigured": no password configured in production — refuse to serve
// rather than run open by accident.
export function gateMode(): "on" | "open" | "misconfigured" {
  if (passwordFor("expert")) return "on";
  return process.env.NODE_ENV === "production" ? "misconfigured" : "open";
}

async function hmac(key: string, message: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message)));
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

function fromHex(hex: string): Uint8Array | null {
  if (!/^[0-9a-f]{64}$/.test(hex)) return null;
  return Uint8Array.from(hex.match(/../g)!, (h) => parseInt(h, 16));
}

export async function tokenFor(role: AccessRole): Promise<string> {
  const password = passwordFor(role);
  if (!password) throw new Error(`No password configured for ${role}`);
  return `${role}.${toHex(await hmac(password, `cap-access:${role}`))}`;
}

export async function roleFromToken(token: string | undefined): Promise<AccessRole | null> {
  if (!token) return null;
  const [role, sig] = token.split(".");
  if (role !== "expert" && role !== "student") return null;
  const password = passwordFor(role);
  const given = fromHex(sig ?? "");
  if (!password || !given) return null;
  return equalBytes(given, await hmac(password, `cap-access:${role}`)) ? role : null;
}

// Which role a typed password unlocks. Both comparisons always run, on
// fixed-length digests, so timing doesn't hint at either password. If the
// two passwords are the same, expert wins.
export async function roleForPassword(attempt: string): Promise<AccessRole | null> {
  const digest = (s: string) => hmac("cap-access-compare", s);
  const typed = await digest(attempt);
  const expert = passwordFor("expert");
  const student = passwordFor("student");
  const isExpert = expert ? equalBytes(typed, await digest(expert)) : false;
  const isStudent = student ? equalBytes(typed, await digest(student)) : false;
  return isExpert ? "expert" : isStudent ? "student" : null;
}

// What a student session may reach: the student site, plus the API calls
// it makes. `/api/moments/[id]/audio` is expert-only (the student flow never
// uploads audio), and `/api/videos`/`/api/moments` only for the student tables.
export function studentMayAccess(pathname: string, audience: string | null): boolean {
  if (pathname === "/student" || pathname.startsWith("/student/")) return true;
  if (pathname === "/api/transcribe") return true;
  if (pathname === "/api/videos" || pathname === "/api/moments") return audience === "student";
  return false;
}

// Only same-site page paths are allowed as a post-login destination.
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  if (next.startsWith("/api") || next.startsWith("/login")) return null;
  return next;
}
