import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// This route is no longer used — Firebase auth is handled entirely client-side
// via signInWithPopup. Keeping it as a fallback redirect.
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/dashboard`);
}
