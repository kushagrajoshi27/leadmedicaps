import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const SESSION_DURATION_MS = 60 * 60 * 24 * 14 * 1000; // 14 days

// POST /api/auth/session  — exchange Firebase ID token for a session cookie
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "idToken required" }, { status: 400 });
    }

    // Verify the ID token and get user details
    const decoded = await adminAuth.verifyIdToken(idToken);

    // Enforce @medicaps.ac.in domain
    const email = decoded.email ?? "";
    if (!email.endsWith("@medicaps.ac.in")) {
      return NextResponse.json(
        { error: "Only @medicaps.ac.in email addresses are allowed" },
        { status: 403 }
      );
    }

    // Block unverified email accounts (Google sign-in is always verified)
    if (!decoded.email_verified) {
      return NextResponse.json(
        { error: "Please verify your email before signing in. Check your inbox for the verification link." },
        { status: 403 }
      );
    }

    // Auto-create Firestore profile document on first sign-in
    const profileRef = adminDb.collection("profiles").doc(decoded.uid);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
      await profileRef.set({
        id: decoded.uid,
        email,
        name: decoded.name ?? "",
        username: "",
        batch: 2025,
        avatar_url: decoded.picture ?? null,
        linkedin_url: null,
        leetcode_username: null,
        codeforces_username: null,
        codechef_username: null,
        cp_score: 0,
        total_solved: 0,
        leetcode_stats: null,
        codeforces_stats: null,
        codechef_stats: null,
        setup_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // Create the session cookie (server-side, httpOnly)
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set("__session", sessionCookie, {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Session creation failed";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

// DELETE /api/auth/session  — clear the session cookie (sign out)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("__session", "", {
    maxAge: 0,
    path: "/",
  });
  return response;
}
