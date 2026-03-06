"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNow, isPast } from "date-fns";
import {
  ExternalLink,
  Clock,
  Calendar,
  Bell,
  BellOff,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ContestInfo } from "@/types";

interface ContestsClientProps {
  initialContests: ContestInfo[];
}

const PLATFORM_COLORS: Record<string, string> = {
  leetcode: "text-[#ffa116]",
  codeforces: "text-[#1f8dd6]",
  codechef: "text-[#6b3a2a]",
};

const PLATFORM_BG: Record<string, string> = {
  leetcode: "bg-[#ffa116]/10 border-[#ffa116]/30",
  codeforces: "bg-[#1f8dd6]/10 border-[#1f8dd6]/30",
  codechef: "bg-[#6b3a2a]/10 border-[#6b3a2a]/30",
};

function CountdownTimer({ startTime }: { startTime: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const update = () => {
      const date = new Date(startTime);
      if (isPast(date)) {
        setStarted(true);
        setTimeLeft("Started");
      } else {
        setStarted(false);
        setTimeLeft(formatDistanceToNow(date, { addSuffix: true }));
      }
    };
    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <span
      className={cn(
        "text-xs font-medium",
        started ? "text-green-500" : "text-muted-foreground"
      )}
    >
      {timeLeft}
    </span>
  );
}

export default function ContestsClient({
  initialContests,
}: ContestsClientProps) {
  const [contests, setContests] = useState<ContestInfo[]>(initialContests);
  const [platform, setPlatform] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const refreshContests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contests");
      if (res.ok) {
        const data = await res.json();
        setContests(data.contests ?? []);
        toast.success("Contests refreshed");
      } else {
        toast.error("Failed to refresh contests");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  const notifyContests = useCallback(async () => {
    setNotifying(true);
    try {
      const res = await fetch("/api/notify/contests", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message ?? "Notifications sent!");
      } else {
        toast.error(data.error ?? "Failed to send notifications");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setNotifying(false);
    }
  }, []);

  const filtered =
    platform === "all"
      ? contests
      : contests.filter((c) => c.platform === platform);

  const upcoming = filtered.filter((c) => !isPast(new Date(c.startTime)));
  const ongoing = filtered.filter((c) => isPast(new Date(c.startTime)));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col gap-3">
        <Tabs
          value={platform}
          onValueChange={setPlatform}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="leetcode" className="text-xs sm:text-sm">LC</TabsTrigger>
            <TabsTrigger value="codeforces" className="text-xs sm:text-sm">CF</TabsTrigger>
            <TabsTrigger value="codechef" className="text-xs sm:text-sm">CC</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshContests}
            disabled={loading}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", loading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={notifyContests}
            disabled={notifying}
          >
            {notifying ? (
              <BellOff className="h-4 w-4 mr-2" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Notify All
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{upcoming.length}</span> upcoming
        </span>
        <span>
          <span className="font-semibold text-foreground">{ongoing.length}</span> started
        </span>
        <span>
          <span className="font-semibold text-foreground">{filtered.length}</span> total
        </span>
      </div>

      {/* Upcoming contests */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Upcoming
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((contest, i) => (
              <ContestCard key={`${contest.platform}-${contest.name}-${i}`} contest={contest} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Ongoing or recently started */}
      {ongoing.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Started / Recent
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ongoing.map((contest, i) => (
              <ContestCard key={`${contest.platform}-${contest.name}-${i}`} contest={contest} index={i} started />
            ))}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No contests found</p>
          <p className="text-sm mt-1">
            Try refreshing or check back later.
          </p>
        </div>
      )}
    </div>
  );
}

function ContestCard({
  contest,
  index,
  started = false,
}: {
  contest: ContestInfo;
  index: number;
  started?: boolean;
}) {
  const platformKey = contest.platform.toLowerCase();
  const colorClass = PLATFORM_COLORS[platformKey] ?? "text-foreground";
  const bgClass = PLATFORM_BG[platformKey] ?? "bg-muted/30 border-border";

  const startDate = new Date(contest.startTime);
  const durationMins = contest.duration;
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const durationLabel =
    hours > 0
      ? `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim()
      : `${mins}m`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={cn("hover-card border h-full flex flex-col", bgClass)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Badge
                variant={platformKey as "leetcode" | "codeforces" | "codechef"}
                className="mb-2 text-xs"
              >
                {contest.platform}
              </Badge>
              <CardTitle className="text-base leading-tight line-clamp-2">
                {contest.name}
              </CardTitle>
            </div>
            {started && (
              <span className="shrink-0 text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-medium">
                Live
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{format(startDate, "MMM d, yyyy · HH:mm")}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">Duration: {durationLabel}</span>
              <CountdownTimer startTime={contest.startTime} />
            </div>
          </div>

          <div className="mt-auto pt-2">
            <Button
              asChild
              size="sm"
              className={cn("w-full gap-2", colorClass)}
              variant="outline"
            >
              <a
                href={contest.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {started ? "Join Now" : "Register"}
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
