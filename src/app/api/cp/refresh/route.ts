import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/firebase/server";
import { adminDb } from "@/lib/firebase/admin";
import { calcCPScore, getTotalSolved } from "@/lib/cp-score";
import { fetchLeetCodeStats, fetchCodeforcesStats, fetchCodeChefStats } from "@/lib/cp-fetch";
import type { LeetCodeStats, CodeforcesStats, CodeChefStats } from "@/types";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { leetcode_username, codeforces_username, codechef_username } = body;

  const [lcResult, cfResult, ccResult] = await Promise.allSettled([
    leetcode_username ? fetchLeetCodeStats(leetcode_username) : Promise.resolve(null),
    codeforces_username ? fetchCodeforcesStats(codeforces_username) : Promise.resolve(null),
    codechef_username ? fetchCodeChefStats(codechef_username) : Promise.resolve(null),
  ]);

  const lcStats: LeetCodeStats | null =
    lcResult.status === "fulfilled" ? lcResult.value : null;
  const cfStats: CodeforcesStats | null =
    cfResult.status === "fulfilled" ? cfResult.value : null;
  const ccStats: CodeChefStats | null =
    ccResult.status === "fulfilled" ? ccResult.value : null;

  const scoreBreakdown = calcCPScore(lcStats, cfStats, ccStats);
  const totalSolved = getTotalSolved(lcStats, cfStats, ccStats);

  // Update profile in Firestore
  await adminDb.collection("profiles").doc(user.uid).update({
    leetcode_stats: lcStats,
    codeforces_stats: cfStats,
    codechef_stats: ccStats,
    cp_score: scoreBreakdown.totalScore,
    total_solved: totalSolved,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    scores: scoreBreakdown,
    totalSolved,
    leetcode: lcStats,
    codeforces: cfStats,
    codechef: ccStats,
  });
}
