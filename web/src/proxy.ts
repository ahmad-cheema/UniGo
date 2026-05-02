import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/auth/session";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];

const IGNORED_PREFIXES = ["/api/auth", "/_next", "/favicon.ico"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip proxy for API auth routes, Next.js internals, and static files
  if (IGNORED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const isAuthenticated = session !== null;
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  // Unauthenticated user trying to access protected route → redirect to sign-in
  if (!isAuthenticated && !isPublicPath) {
    const signInUrl = new URL("/sign-in", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Authenticated user trying to access auth pages → redirect to app
  if (isAuthenticated && isPublicPath) {
    const appUrl = new URL("/universities", request.url);
    return NextResponse.redirect(appUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
