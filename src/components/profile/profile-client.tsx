"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Linkedin,
  MessageCircle,
  Edit,
  Award,
  Code2,
  Target,
  TrendingUp,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getCPScoreLabel, calcCPScore } from "@/lib/cp-score";
import { cn } from "@/lib/utils";
import type { UserProfile, LeetCodeStats, CodeforcesStats, CodeChefStats } from "@/types";

type Platform = "leetcode" | "codeforces" | "codechef";

interface ProfileClientProps {
  profile: UserProfile;
  currentUserId: string;
  currentUsername: string;
  isOwnProfile: boolean;
}

export default function ProfileClient({
  profile,
  isOwnProfile,
}: ProfileClientProps) {
  const [imgError, setImgError] = useState(false);

  // Platform usernames — editable by owner
  const [lcUsername, setLcUsername] = useState(profile.leetcode_username ?? null);
  const [cfUsername, setCfUsername] = useState(profile.codeforces_username ?? null);
  const [ccUsername, setCcUsername] = useState(profile.codechef_username ?? null);

  // Platform stats — updated after an edit
  const [lcStats, setLcStats] = useState<LeetCodeStats | null>(
    profile.leetcode_stats as LeetCodeStats | null
  );
  const [cfStats, setCfStats] = useState<CodeforcesStats | null>(
    profile.codeforces_stats as CodeforcesStats | null
  );
  const [ccStats, setCcStats] = useState<CodeChefStats | null>(
    profile.codechef_stats as CodeChefStats | null
  );

  // Edit dialog state
  const [editPlatform, setEditPlatform] = useState<Platform | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  function openEdit(platform: Platform) {
    const current =
      platform === "leetcode" ? lcUsername :
      platform === "codeforces" ? cfUsername : ccUsername;
    setEditValue(current ?? "");
    setEditPlatform(platform);
  }

  async function handleSave() {
    if (!editPlatform) return;
    const trimmed = editValue.trim();
    const current =
      editPlatform === "leetcode" ? lcUsername :
      editPlatform === "codeforces" ? cfUsername : ccUsername;
    if (!trimmed || trimmed === current) { setEditPlatform(null); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/cp/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: editPlatform, username: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");

      if (editPlatform === "leetcode") { setLcUsername(data.username); setLcStats(data.stats); }
      if (editPlatform === "codeforces") { setCfUsername(data.username); setCfStats(data.stats); }
      if (editPlatform === "codechef") { setCcUsername(data.username); setCcStats(data.stats); }

      toast.success(`${editPlatform.charAt(0).toUpperCase() + editPlatform.slice(1)} username updated!`);
      setEditPlatform(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  const initials = profile.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const scoreBreakdown = calcCPScore(
    lcStats
      ? {
          easySolved: lcStats.easySolved ?? 0,
          mediumSolved: lcStats.mediumSolved ?? 0,
          hardSolved: lcStats.hardSolved ?? 0,
          acceptanceRate: lcStats.acceptanceRate ?? 0,
          totalSolved: lcStats.totalSolved ?? 0,
          ranking: lcStats.ranking ?? 0,
          contestRating: lcStats.contestRating ?? 0,
          contestAttended: lcStats.contestAttended ?? 0,
          contributionPoints: 0,
          reputation: 0,
          submissionCalendar: {},
          username: lcUsername ?? "",
        }
      : null,
    cfStats
      ? {
          rating: cfStats.rating ?? 0,
          maxRating: cfStats.maxRating ?? 0,
          rank: cfStats.rank ?? "",
          maxRank: cfStats.maxRank ?? "",
          totalSolved: cfStats.totalSolved ?? 0,
          contribution: cfStats.contribution ?? 0,
        }
      : null,
    ccStats
      ? {
          rating: ccStats.rating ?? 0,
          highestRating: ccStats.highestRating ?? 0,
          stars: typeof ccStats.stars === "number" ? ccStats.stars : parseInt(String(ccStats.stars), 10) || 0,
          globalRank: ccStats.globalRank ?? 0,
          countryRank: ccStats.countryRank ?? 0,
          totalSolved: ccStats.totalSolved ?? 0,
        }
      : null
  );

  const scoreLabelObj = getCPScoreLabel(scoreBreakdown.totalScore);
  const scoreLabel = scoreLabelObj.label;

  const totalSolved = (lcStats?.totalSolved ?? 0) + (cfStats?.totalSolved ?? 0) + (ccStats?.totalSolved ?? 0);

  const statCards = [
    {
      label: "CP Score",
      value: scoreBreakdown.totalScore.toFixed(1),
      icon: Award,
      color: "text-indigo-400",
      sub: scoreLabel,
    },
    {
      label: "Total Solved",
      value: totalSolved,
      icon: Code2,
      color: "text-emerald-400",
    },
    {
      label: "LeetCode",
      value: lcUsername
        ? `${lcStats?.totalSolved ?? 0} solved`
        : "—",
      icon: Target,
      color: "text-[#ffa116]",
      sub: lcUsername ?? undefined,
    },
    {
      label: "Codeforces",
      value: cfUsername
        ? (cfStats?.rating ?? 0)
        : "—",
      icon: TrendingUp,
      color: "text-[#1f8dd6]",
      sub: cfStats?.rank ?? "",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass border-primary/20">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-24 w-24 ring-4 ring-primary/30 shrink-0">
                {!imgError && profile.avatar_url ? (
                  <AvatarImage
                    src={profile.avatar_url}
                    alt={profile.name ?? ""}
                    onError={() => setImgError(true)}
                  />
                ) : null}
                <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">{profile.name}</h1>
                <p className="text-muted-foreground text-sm">
                  @{profile.username}
                </p>
                <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                  {profile.batch && (
                    <Badge variant="secondary">Batch {profile.batch}</Badge>
                  )}
                  <Badge variant="outline" className="text-indigo-400 border-indigo-400/30">
                    {scoreLabel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {profile.email}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-row sm:flex-col gap-2 shrink-0 flex-wrap justify-center sm:justify-start">
                {isOwnProfile ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href="/setup">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" className="gap-2">
                    <Link href={`/messages?user=${profile.id}`}>
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Link>
                  </Button>
                )}
                {profile.linkedin_url && (
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {statCards.map((stat) => (
          <Card key={stat.label} className="glass border-border/50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={cn("h-4 w-4", stat.color)} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.sub && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {stat.sub}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* CP Score breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">CP Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: "LeetCode",
                value: scoreBreakdown.leetcodeNorm,
                weight: "30%",
                color: "bg-[#ffa116]",
              },
              {
                label: "Codeforces",
                value: scoreBreakdown.codeforcesNorm,
                weight: "40%",
                color: "bg-[#1f8dd6]",
              },
              {
                label: "CodeChef",
                value: scoreBreakdown.codechefNorm,
                weight: "30%",
                color: "bg-[#6b3a2a]",
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">
                    {item.label}{" "}
                    <span className="text-xs">({item.weight})</span>
                  </span>
                  <span className="font-semibold">
                    {item.value.toFixed(1)}/100
                  </span>
                </div>
                <Progress
                  value={item.value}
                  className="h-2"
                />
              </div>
            ))}

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total CP Score</span>
              <span className="text-xl font-bold gradient-text">
                {scoreBreakdown.totalScore.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Platform profiles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Platform Profiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-3">
              <PlatformRow
                name="LeetCode"
                username={lcUsername}
                href={lcUsername ? `https://leetcode.com/${lcUsername}` : null}
                borderColor="border-[#ffa116]/30"
                bgColor="bg-[#ffa116]/5"
                hoverColor="hover:bg-[#ffa116]/10"
                textColor="text-[#ffa116]"
                isOwnProfile={isOwnProfile}
                onEdit={() => openEdit("leetcode")}
              />
              <PlatformRow
                name="Codeforces"
                username={cfUsername}
                href={cfUsername ? `https://codeforces.com/profile/${cfUsername}` : null}
                borderColor="border-[#1f8dd6]/30"
                bgColor="bg-[#1f8dd6]/5"
                hoverColor="hover:bg-[#1f8dd6]/10"
                textColor="text-[#1f8dd6]"
                isOwnProfile={isOwnProfile}
                onEdit={() => openEdit("codeforces")}
              />
              <PlatformRow
                name="CodeChef"
                username={ccUsername}
                href={ccUsername ? `https://www.codechef.com/users/${ccUsername}` : null}
                borderColor="border-[#6b3a2a]/30"
                bgColor="bg-[#6b3a2a]/5"
                hoverColor="hover:bg-[#6b3a2a]/10"
                textColor="text-[#a0522d]"
                isOwnProfile={isOwnProfile}
                onEdit={() => openEdit("codechef")}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit username dialog — only own profile */}
      {isOwnProfile && (
        <Dialog open={editPlatform !== null} onOpenChange={(v) => { if (!v) setEditPlatform(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>
                Edit {editPlatform ? editPlatform.charAt(0).toUpperCase() + editPlatform.slice(1) : ""} Username
              </DialogTitle>
            </DialogHeader>
            <div className="py-2 space-y-2">
              <Label htmlFor="profile-platform-username">Username</Label>
              <Input
                id="profile-platform-username"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={`Your ${editPlatform ?? ""} username`}
                onKeyDown={(e) => e.key === "Enter" && !saving && handleSave()}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Stats and scores will update automatically.
              </p>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="ghost" disabled={saving}>Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave} disabled={saving || !editValue.trim()}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface PlatformRowProps {
  name: string;
  username: string | null;
  href: string | null;
  borderColor: string;
  bgColor: string;
  hoverColor: string;
  textColor: string;
  isOwnProfile: boolean;
  onEdit: () => void;
}

function PlatformRow({
  name,
  username,
  href,
  borderColor,
  bgColor,
  hoverColor,
  textColor,
  isOwnProfile,
  onEdit,
}: PlatformRowProps) {
  if (!username && !isOwnProfile) return null;

  return (
    <div className={`flex items-center gap-1 p-3 rounded-lg border ${borderColor} ${bgColor} transition-colors`}>
      {/* Link area */}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 flex-1 min-w-0 ${hoverColor} rounded transition-colors`}
        >
          <span className={`text-sm font-medium ${textColor} flex-1 truncate`}>{name}</span>
          <span className="text-xs text-muted-foreground truncate">{username}</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
        </a>
      ) : (
        <span className="flex-1 text-sm text-muted-foreground">
          {name} <span className="text-xs">(not linked)</span>
        </span>
      )}
      {/* Pencil — own profile only */}
      {isOwnProfile && (
        <button
          onClick={onEdit}
          title={`Edit ${name} username`}
          className="ml-1 p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
