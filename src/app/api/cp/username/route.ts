import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/firebase/server";
import { adminDb } from "@/lib/firebase/admin";
import { calcCPScore, getTotalSolved } from "@/lib/cp-score";
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

  // Fetch fresh stats for this platform
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const statsRes = await fetch(
    `${baseUrl}/api/cp/${platform}?username=${encodeURIComponent(trimmed)}`,
    { cache: "no-store" }
  );

  if (!statsRes.ok) {
    return NextResponse.json(
      { error: `Could not fetch stats for "${trimmed}" on ${platform}. Check that the username is correct.` },
      { status: 422 }
    );
  }

  const newStats = await statsRes.json();

  // We need the existing stats for the other two platforms to recalculate CP score
  const profileDoc = await adminDb.collection("profiles").doc(user.uid).get();
  const profileData = profileDoc.data();

  const lcStats: LeetCodeStats | null =
    platform === "leetcode" ? newStats : (profileData?.leetcode_stats as LeetCodeStats | null) ?? null;
  const cfStats: CodeforcesStats | null =
    platform === "codeforces" ? newStats : (profileData?.codeforces_stats as CodeforcesStats | null) ?? null;
  const ccStats: CodeChefStats | null =
    platform === "codechef" ? newStats : (profileData?.codechef_stats as CodeChefStats | null) ?? null;

  const scoreBreakdown = calcCPScore(lcStats, cfStats, ccStats);
  const totalSolved = getTotalSolved(lcStats, cfStats, ccStats);

  await adminDb.collection("profiles").doc(user.uid).update({
    [PLATFORM_FIELD[platform]]: trimmed,
    [STATS_FIELD[platform]]: newStats as Record<string, unknown>,
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
