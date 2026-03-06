import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/firebase/server";
import { adminDb } from "@/lib/firebase/admin";
import { calcCPScore, getTotalSolved } from "@/lib/cp-score";
import { fetchLeetCodeStats, fetchCodeforcesStats, fetchCodeChefStats } from "@/lib/cp-fetch";
import type { LeetCodeStats, CodeforcesStats, CodeChefStats } from "@/types";

type Platform = "leetcode" | "codeforces" | "codechef";

const PLATFORM_FIELD: Record<Platform, string> = {
  leetcode: "leetcode_username",
  codeforces: "codeforces_username",
  codechef: "codechef_username",
};

const STATS_FIELD: Record<Platform, string> = {
  leetcode: "leetcode_stats",
  codeforces: "codeforces_stats",
  codechef: "codechef_stats",
};

/** PATCH /api/cp/username
 * Body: { platform: "leetcode" | "codeforces" | "codechef", username: string }
 * Updates the user's platform username, fetches fresh stats, and saves to DB.
 */
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { platform, username } = body as { platform: Platform; username: string };

  if (!platform || !["leetcode", "codeforces", "codechef"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const trimmed = (username ?? "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Username cannot be empty" }, { status: 400 });
  }

  // Fetch fresh stats for this platform directly (no self-calling)
  let newStats: LeetCodeStats | CodeforcesStats | CodeChefStats;
  try {
    if (platform === "leetcode") newStats = await fetchLeetCodeStats(trimmed);
    else if (platform === "codeforces") newStats = await fetchCodeforcesStats(trimmed);
    else newStats = await fetchCodeChefStats(trimmed);
  } catch {
    return NextResponse.json(
      { error: `Could not fetch stats for "${trimmed}" on ${platform}. Check that the username is correct.` },
      { status: 422 }
    );
  }

  // We need the existing stats for the other two platforms to recalculate CP score
  const profileDoc = await adminDb.collection("profiles").doc(user.uid).get();
  const profileData = profileDoc.data();

  const lcStats: LeetCodeStats | null =
    platform === "leetcode" ? (newStats as LeetCodeStats) : (profileData?.leetcode_stats as LeetCodeStats | null) ?? null;
  const cfStats: CodeforcesStats | null =
    platform === "codeforces" ? (newStats as CodeforcesStats) : (profileData?.codeforces_stats as CodeforcesStats | null) ?? null;
  const ccStats: CodeChefStats | null =
    platform === "codechef" ? (newStats as CodeChefStats) : (profileData?.codechef_stats as CodeChefStats | null) ?? null;

  const scoreBreakdown = calcCPScore(lcStats, cfStats, ccStats);
  const totalSolved = getTotalSolved(lcStats, cfStats, ccStats);

  await adminDb.collection("profiles").doc(user.uid).update({
    [PLATFORM_FIELD[platform]]: trimmed,
    [STATS_FIELD[platform]]: newStats as unknown as Record<string, unknown>,
    cp_score: scoreBreakdown.totalScore,
    total_solved: totalSolved,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({
    platform,
    username: trimmed,
    stats: newStats,
    cpScore: scoreBreakdown.totalScore,
    totalSolved,
  });
}
