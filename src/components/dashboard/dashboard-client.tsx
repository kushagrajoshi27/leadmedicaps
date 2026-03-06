"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Code2,
  Trophy,
  Target,
  TrendingUp,
  ExternalLink,
  Linkedin,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CPProgressChart } from "@/components/dashboard/cp-progress-chart";
import { PlatformCard } from "@/components/dashboard/platform-card";
import { toast } from "sonner";
import { calcCPScore, getCPScoreLabel, getTotalSolved } from "@/lib/cp-score";
import { getCFRankColor } from "@/lib/utils";
import type {
  LeetCodeStats,
  CodeforcesStats,
  CodeChefStats,
} from "@/types";

interface DashboardClientProps {
  profile: {
    id: string;
    name: string;
    email: string;
    username: string;
    batch: number;
    avatar_url?: string | null;
    linkedin_url?: string | null;
    leetcode_username?: string | null;
    codeforces_username?: string | null;
    codechef_username?: string | null;
    cp_score: number;
    total_solved: number;
    leetcode_stats?: LeetCodeStats | null;
    codeforces_stats?: CodeforcesStats | null;
    codechef_stats?: CodeChefStats | null;
    [key: string]: unknown;
  };
}

export function DashboardClient({ profile }: DashboardClientProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [lcUsername, setLcUsername] = useState(profile.leetcode_username ?? null);
  const [cfUsername, setCfUsername] = useState(profile.codeforces_username ?? null);
  const [ccUsername, setCcUsername] = useState(profile.codechef_username ?? null);
  const [lcStats, setLcStats] = useState<LeetCodeStats | null>(
    profile.leetcode_stats as LeetCodeStats | null
  );
  const [cfStats, setCfStats] = useState<CodeforcesStats | null>(
    profile.codeforces_stats as CodeforcesStats | null
  );
  const [ccStats, setCcStats] = useState<CodeChefStats | null>(
    profile.codechef_stats as CodeChefStats | null
  );

  const cpScore = calcCPScore(lcStats, cfStats, ccStats);
  const scoreBreakdown = cpScore;
  const totalSolved = getTotalSolved(lcStats, cfStats, ccStats);
  const { label: cpLabel, color: cpColor } = getCPScoreLabel(cpScore.totalScore);

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/cp/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leetcode_username: lcUsername,
          codeforces_username: cfUsername,
          codechef_username: ccUsername,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.leetcode) setLcStats(data.leetcode);
      if (data.codeforces) setCfStats(data.codeforces);
      if (data.codechef) setCcStats(data.codechef);

      toast.success("Stats refreshed successfully!");
    } catch {
      toast.error("Failed to refresh stats");
    } finally {
      setRefreshing(false);
    }
  }, [lcUsername, cfUsername, ccUsername]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-2 ring-primary/20 shrink-0">
            <AvatarImage src={profile.avatar_url ?? ""} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{profile.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-muted-foreground">
                @{profile.username}
              </span>
              <Badge variant="outline" className="text-xs">
                Batch {profile.batch}
              </Badge>
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Badge variant="info" className="gap-1 cursor-pointer hover:opacity-80">
                    <Linkedin className="h-3 w-3" />
                    LinkedIn
                  </Badge>
                </a>
              )}
            </div>
          </div>
        </motion.div>

        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2 shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Stats
        </Button>
      </div>

      {/* Score Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* CP Score */}
        <Card
          hover
          className="col-span-1 sm:col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-primary/20 pulse-glow"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">CP Score</p>
                <p className="text-4xl font-black gradient-text">
                  {cpScore.totalScore.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">out of 100</p>
              </div>
              <div
                className={`h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center`}
              >
                <Trophy className="h-5 w-5 text-primary" />
              </div>
            </div>
            <Badge variant="outline" className={`${cpColor} border-current/30`}>
              {cpLabel}
            </Badge>
            <Progress
              value={cpScore.totalScore}
              className="mt-3 h-1.5"
            />
          </CardContent>
        </Card>

        {/* Total Solved */}
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Solved</p>
              <Target className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-3xl font-bold">{totalSolved}</p>
            <p className="text-xs text-muted-foreground mt-1">
              problems across all platforms
            </p>
          </CardContent>
        </Card>

        {/* LeetCode Stats */}
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-muted-foreground">LeetCode Solved</p>
              <Badge variant="leetcode" className="text-xs">LC</Badge>
            </div>
            <p className="text-3xl font-bold">{lcStats?.totalSolved ?? "—"}</p>
            {lcStats && (
              <div className="flex gap-2 mt-2 text-xs">
                <span className="text-green-400">{lcStats.easySolved}E</span>
                <span className="text-yellow-400">{lcStats.mediumSolved}M</span>
                <span className="text-red-400">{lcStats.hardSolved}H</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Codeforces Rating */}
        <Card hover>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-muted-foreground">CF Rating</p>
              <Badge variant="codeforces" className="text-xs">CF</Badge>
            </div>
            <p className="text-3xl font-bold">{cfStats?.rating ?? "—"}</p>
            {cfStats && (
              <p className={`text-xs mt-1 capitalize ${getCFRankColor(cfStats.rank)}`}>
                {cfStats.rank}
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Score Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              CP Score Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#ffa116]" />
                    LeetCode (30%)
                  </span>
                  <span className="font-medium">{scoreBreakdown.leetcodeNorm.toFixed(1)} / 100</span>
                </div>
                <Progress value={scoreBreakdown.leetcodeNorm} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#1f8dd6]" />
                    Codeforces (40%)
                  </span>
                  <span className="font-medium">{scoreBreakdown.codeforcesNorm.toFixed(1)} / 100</span>
                </div>
                <Progress value={scoreBreakdown.codeforcesNorm} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-orange-400" />
                    CodeChef (30%)
                  </span>
                  <span className="font-medium">{scoreBreakdown.codechefNorm.toFixed(1)} / 100</span>
                </div>
                <Progress value={scoreBreakdown.codechefNorm} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Platform Cards & Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="leetcode" className="text-xs sm:text-sm">LeetCode</TabsTrigger>
            <TabsTrigger value="codeforces" className="text-xs sm:text-sm">Codeforces</TabsTrigger>
            <TabsTrigger value="codechef" className="text-xs sm:text-sm">CodeChef</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <CPProgressChart
              lcStats={lcStats}
              cfStats={cfStats}
              ccStats={ccStats}
              cpScore={cpScore}
            />
          </TabsContent>

          <TabsContent value="leetcode">
            <PlatformCard
              platform="leetcode"
              username={lcUsername}
              stats={lcStats}
              onUsernameUpdate={(u, s) => { setLcUsername(u); setLcStats(s as LeetCodeStats); }}
            />
          </TabsContent>

          <TabsContent value="codeforces">
            <PlatformCard
              platform="codeforces"
              username={cfUsername}
              stats={cfStats}
              onUsernameUpdate={(u, s) => { setCfUsername(u); setCfStats(s as CodeforcesStats); }}
            />
          </TabsContent>

          <TabsContent value="codechef">
            <PlatformCard
              platform="codechef"
              username={ccUsername}
              stats={ccStats}
              onUsernameUpdate={(u, s) => { setCcUsername(u); setCcStats(s as CodeChefStats); }}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
