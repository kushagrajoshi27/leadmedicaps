import { cookies } from "next/headers";
import { adminAuth, adminDb } from "./admin";
import type { UserProfile } from "@/types";

export type DecodedUser = {
  uid: string;
  email: string;
  name?: string;
};

/**
 * Reads the __session cookie and verifies it with Firebase Admin.
 * Returns the decoded token or null if invalid/missing.
 */
export async function getCurrentUser(): Promise<DecodedUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("__session")?.value;

  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: decoded.name,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the current user AND their Firestore profile document.
 */
export async function getCurrentUserWithProfile(): Promise<{
  user: DecodedUser | null;
  profile: UserProfile | null;
}> {
  const user = await getCurrentUser();
  if (!user) return { user: null, profile: null };

  const profileDoc = await adminDb
    .collection("profiles")
    .doc(user.uid)
    .get();

  const profile = profileDoc.exists
    ? ({ id: profileDoc.id, ...profileDoc.data() } as UserProfile)
    : null;

  return { user, profile };
}

/**
 * Fetches any profile document by its document ID (= user UID).
 */
export async function getProfileById(uid: string): Promise<UserProfile | null> {
  const doc = await adminDb.collection("profiles").doc(uid).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as UserProfile;
}

/**
 * Fetches a profile document by the `username` field.
 */
export async function getProfileByUsername(
  username: string
): Promise<UserProfile | null> {
  const snap = await adminDb
    .collection("profiles")
    .where("username", "==", username)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as UserProfile;
}
