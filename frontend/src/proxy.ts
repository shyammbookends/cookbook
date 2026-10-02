import { NextRequest, NextResponse } from "next/server";

/**
 * A lightweight, edge-safe gate: redirects to /admin/login if the session
 * cookie is simply missing. This is NOT the real authorization check — it
 * only saves a round trip for the common "not logged in" case. The actual
 * session validity + role check happens in `requireAdmin()` on every admin
 * server action and route handler (see src/server/auth/guard.ts), which is
 * the check that actually matters.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasSession = request.cookies.has("bookends_admin_session");
    if (!hasSession) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
