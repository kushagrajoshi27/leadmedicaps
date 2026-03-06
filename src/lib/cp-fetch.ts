/**
 * Shared helpers that fetch CP stats directly from external APIs.
 * Used by both the individual platform routes and the refresh/username routes
 * so we never need to self-call our own Next.js API endpoints (which breaks on Vercel).
 */

import type { LeetCodeStats, CodeforcesStats, CodeChefStats } from "@/types";

export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats> {
  const query = `
    query userProfile($username: String!) {
      matchedUser(username: $username) {
        username
        submitStats: submitStatsGlobal {
          acSubmissionNum { difficulty count submissions }
        }
        profile { ranking reputation }
        contributions { points }
      }
      userContestRanking(username: $username) {
        rating
        attendedContestsCount
      }
    }
  `;

  const response = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query, variables: { username } }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) throw new Error(`LeetCode API returned ${response.status}`);

  const data = await response.json();
  const user = data?.data?.matchedUser;
  if (!user) throw new Error("User not found on LeetCode");

  const acStats = user.submitStats?.acSubmissionNum ?? [];
  const total  = acStats.find((s: { difficulty: string }) => s.difficulty === "All");
  const easy   = acStats.find((s: { difficulty: string }) => s.difficulty === "Easy");
  const medium = acStats.find((s: { difficulty: string }) => s.difficulty === "Medium");
  const hard   = acStats.find((s: { difficulty: string }) => s.difficulty === "Hard");
  const contest = data?.data?.userContestRanking;

  return {
    username,
    totalSolved: total?.count ?? 0,
    easySolved: easy?.count ?? 0,
    mediumSolved: medium?.count ?? 0,
    hardSolved: hard?.count ?? 0,
    ranking: user.profile?.ranking ?? 0,
    contributionPoints: user.contributions?.points ?? 0,
    reputation: user.profile?.reputation ?? 0,
    submissionCalendar: {},
    acceptanceRate:
      total?.submissions > 0
        ? Math.round((total.count / total.submissions) * 100 * 10) / 10
        : 0,
    contestRating: contest?.rating ?? 0,
    contestAttended: contest?.attendedContestsCount ?? 0,
  };
}

export async function fetchCodeforcesStats(username: string): Promise<CodeforcesStats> {
  const [userRes, subsRes] = await Promise.all([
    fetch(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(username)}`, {
      next: { revalidate: 3600 },
    }),
    fetch(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}&from=1&count=10000`,
      { next: { revalidate: 3600 } }
    ),
  ]);

  if (!userRes.ok) throw new Error(`Codeforces API returned ${userRes.status}`);
  const userData = await userRes.json();
  if (userData.status !== "OK" || !userData.result?.length)
    throw new Error("User not found on Codeforces");

  const cf = userData.result[0];

  let problemsSolved = 0;
  if (subsRes.ok) {
    const subData = await subsRes.json();
    if (subData.status === "OK") {
      const solved = new Set<string>();
      for (const sub of subData.result) {
        if (sub.verdict === "OK")
          solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
      }
      problemsSolved = solved.size;
    }
  }

  return {
    handle: cf.handle,
    rating: cf.rating ?? 0,
    maxRating: cf.maxRating ?? 0,
    rank: cf.rank ?? "unrated",
    maxRank: cf.maxRank ?? "unrated",
    contribution: cf.contribution ?? 0,
    friendOfCount: cf.friendOfCount ?? 0,
    titlePhoto: cf.titlePhoto ?? "",
    totalSolved: problemsSolved,
    problemsSolved,
  };
}

export async function fetchCodeChefStats(username: string): Promise<CodeChefStats> {
  const response = await fetch(
    `https://competeapi.vercel.app/user/codechef/${encodeURIComponent(username)}`,
    { next: { revalidate: 3600 }, headers: { Accept: "application/json" } }
  );

  if (!response.ok) throw new Error("User not found on CodeChef");

  const data = await response.json();
  if (!data || data.error || !data.username)
    throw new Error("User not found on CodeChef");

  const ratingNumber = data.rating_number ?? 0;

  const getStars = (r: number): string => {
    if (r >= 2500) return "7★";
    if (r >= 2200) return "6★";
    if (r >= 2000) return "5★";
    if (r >= 1800) return "4★";
    if (r >= 1600) return "3★";
    if (r >= 1400) return "2★";
    return "1★";
  };

  const parseRank = (val: unknown): number => {
    if (typeof val === "number") return val;
    if (typeof val === "string" && /^\d+$/.test(val)) return parseInt(val, 10);
    return 0;
  };

  return {
    username: data.username ?? username,
    rating: ratingNumber,
    stars: data.rating ?? getStars(ratingNumber),
    highestRating: data.max_rank ?? ratingNumber,
    globalRank: parseRank(data.global_rank),
    countryRank: parseRank(data.country_rank),
    totalSolved: 0,
    fullySolved: 0,
    partiallySolved: 0,
  };
}
