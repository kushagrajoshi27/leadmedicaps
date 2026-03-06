import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-compatible session check.
 *
 * Firebase Admin cannot run in the Edge Runtime, so we do a lightweight
 * JWT decode (no signature verification) to check expiry.
 * Full verification happens inside each Server Component via firebase-admin.
 */
function decodeSessionCookie(cookie: string): { exp?: number } | null {
  try {
    const payload = cookie.split(".")[1];
    // Convert base64url → base64 and add padding
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
    const decoded = JSON.parse(atob(padded));
    return decoded;
  } catch {
    return null;
  }
}

function isSessionValid(cookie: string): boolean {
  const payload = decodeSessionCookie(cookie);
  if (!payload) return false;
  if (!payload.exp) return false;
  return payload.exp * 1000 > Date.now();
}

export async function updateSession(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;
  const path = request.nextUrl.pathname;

  // Never redirect API routes — they handle their own auth
  if (path.startsWith("/api/")) {
    return NextResponse.next();
  }

  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/auth/auth-code-error",
  ];
  const isPublicRoute = publicRoutes.some(
    (r) => path === r || path.startsWith(r + "/")
  );

  const loggedIn = !!sessionCookie && isSessionValid(sessionCookie);

  // Not logged in → protect dashboard routes
  if (!loggedIn && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    // Clear a stale cookie so it doesn't cause loops on the next request
    if (sessionCookie) response.cookies.delete("__session");
    return response;
  }

  return NextResponse.next();
}
