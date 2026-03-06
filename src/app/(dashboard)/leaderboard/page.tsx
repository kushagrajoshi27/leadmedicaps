import { getCurrentUser } from "@/lib/firebase/server";
import { adminDb } from "@/lib/firebase/admin";
import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client";
import type { UserProfile } from "@/types";

// Revalidate leaderboard every 60 seconds in production
export const revalidate = 60;

export default async function LeaderboardPage() {
  const user = await getCurrentUser();

  const snap = await adminDb
    .collection("profiles")
    .where("setup_complete", "==", true)
    .orderBy("cp_score", "desc")
    .orderBy("total_solved", "desc")
    .get();

  const leaderboard = snap.docs.map((doc, i) => {
    const data = doc.data() as UserProfile;
    return {
      id: doc.id,
      rank: i + 1,
      name: data.name ?? "",
      username: data.username ?? "",
      batch: data.batch ?? 0,
      avatar_url: data.avatar_url ?? null,
      cp_score: data.cp_score ?? 0,
      total_solved: data.total_solved ?? 0,
      leetcode_username: data.leetcode_username ?? null,
      codeforces_username: data.codeforces_username ?? null,
      codechef_username: data.codechef_username ?? null,
    };
  });

  return <LeaderboardClient entries={leaderboard} currentUserId={user?.uid} />;
}
