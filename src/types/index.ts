export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  batch: number | null;
  branch?: string | null;
  avatar_url?: string | null;
  linkedin_url?: string | null;
  leetcode_username?: string | null;
  codeforces_username?: string | null;
  codechef_username?: string | null;
  cp_score: number;
  total_solved: number;
  setup_complete?: boolean;
  leetcode_stats?: LeetCodeStats | null;
  codeforces_stats?: CodeforcesStats | null;
  codechef_stats?: CodeChefStats | null;
  created_at: string;
  updated_at: string;
}

export interface LeetCodeStats {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  contributionPoints: number;
  reputation: number;
  submissionCalendar: Record<string, number>;
  acceptanceRate: number;
  contestRating?: number;
  contestAttended?: number;
}

export interface CodeforcesStats {
  handle: string;
  rating: number;
  maxRating: number;
  rank: string;
  maxRank: string;
  contribution: number;
  friendOfCount: number;
  titlePhoto: string;
  totalSolved: number;
  problemsSolved: number;
}

export interface CodeChefStats {
  username: string;
  rating: number;
  stars: number | string;
  highestRating: number;
  globalRank: number;
  countryRank: number;
  totalSolved: number;
  fullySolved: number;
  partiallySolved: number;
}

export interface CPScoreBreakdown {
  leetcodeScore: number;
  codeforcesScore: number;
  codechefScore: number;
  totalScore: number;
  leetcodeNorm: number;
  codeforcesNorm: number;
  codechefNorm: number;
}

export interface ContestInfo {
  id: string;
  name: string;
  platform: "leetcode" | "codeforces" | "codechef";
  startTime: string;
  endTime: string;
  /** Duration in minutes */
  duration: number;
  url: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  sender?: UserProfile;
  receiver?: UserProfile;
}

export interface Conversation {
  other_user: UserProfile;
  last_message: Message;
  unread_count: number;
}

export interface LeaderboardEntry extends UserProfile {
  rank: number;
  leetcode_stats?: LeetCodeStats;
  codeforces_stats?: CodeforcesStats;
  codechef_stats?: CodeChefStats;
}
