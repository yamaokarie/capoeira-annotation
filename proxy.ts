import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, gateMode, roleFromToken, studentMayAccess } from "@/lib/access";

// Every page and API route sits behind the shared-password gate — see
// lib/access.ts. Redirects are built off the host the browser asked for
// (forwarded by Railway's edge), not `request.nextUrl`, whose host is the
// address the server listens on — that would send people to an internal URL.
function redirectTo(request: NextRequest, pathname: string, next?: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? request.nextUrl.protocol.replace(":", "");
  const url = new URL(pathname, `${proto}://${host}`);
  if (next) url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const mode = gateMode();
  if (mode === "open") return NextResponse.next();
  if (mode === "misconfigured") {
    return new NextResponse("Access gate not configured: set ANNOTATOR_PASSWORD.", { status: 503 });
  }

  if (pathname === "/login" || pathname === "/api/login") return NextResponse.next();

  const isApi = pathname.startsWith("/api/");
  const role = await roleFromToken(request.cookies.get(ACCESS_COOKIE)?.value);

  if (!role) {
    if (isApi) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    return redirectTo(request, "/login", pathname + search);
  }

  if (role === "student" && !studentMayAccess(pathname, searchParams.get("audience"))) {
    if (isApi) return NextResponse.json({ error: "Not available on the student site" }, { status: 403 });
    return redirectTo(request, "/student");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico).*)"],
};
