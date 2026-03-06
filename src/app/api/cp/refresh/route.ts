import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/firebase/server";
import { adminDb } from "@/lib/firebase/admin";
import { calcCPScore, getTotalSolved } from "@/lib/cp-score";
import type {
  LeetCodeStats,
  CodeforcesStats,
  CodeChefStats,
} from "@/types";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { leetcode_username, codeforces_username, codechef_username } = body;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const fetches: Promise<Response>[] = [];
  if (leetcode_username) {
    fetches.push(fetch(`${baseUrl}/api/cp/leetcode?username=${leetcode_username}`));
  }
  if (codeforces_username) {
    fetches.push(fetch(`${baseUrl}/api/cp/codeforces?username=${codeforces_username}`));
  }
  if (codechef_username) {
    fetches.push(fetch(`${baseUrl}/api/cp/codechef?username=${codechef_username}`));
  }

  const results = await Promise.allSettled(fetches);

  let lcStats: LeetCodeStats | null = null;
  let cfStats: CodeforcesStats | null = null;
  let ccStats: CodeChefStats | null = null;

  let idx = 0;
  if (leetcode_username) {
    const res = results[idx++];
    if (res.status === "fulfilled" && res.value.ok) {
      lcStats = await res.value.json();
    }
  }
  if (codeforces_username) {
    const res = results[idx++];
    if (res.status === "fulfilled" && res.value.ok) {
      cfStats = await res.value.json();
    }
  }
  if (codechef_username) {
    const res = results[idx++];
    if (res.status === "fulfilled" && res.value.ok) {
      ccStats = await res.value.json();
    }
  }

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
