"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Code2,
  Trophy,
  Zap,
  Users,
  BarChart3,
  Calendar,
  ArrowRight,
  Star,
  Github,
  MessageSquare,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const features = [
  {
    icon: Trophy,
    title: "CP Leaderboard",
    description:
      "See where you stand among Medicaps coders with our live ranking based on LeetCode, Codeforces & CodeChef.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: BarChart3,
    title: "Progress Graphs",
    description:
      "Visualize your journey with interactive charts showing your rating progress and problem-solving history.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Calendar,
    title: "Upcoming Contests",
    description:
      "Never miss a contest. Get all LeetCode, Codeforces, and CodeChef contests in one place with direct links.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: MessageSquare,
    title: "Direct Messaging",
    description:
      "Connect with fellow coders, share solutions and discuss problems through in-app messaging.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Users,
    title: "Student Profiles",
    description:
      "Explore other students' profiles, visit their coding platforms, and get inspired.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
  {
    icon: Zap,
    title: "Smart CP Score",
    description:
      "One unified score combining performance across all three platforms using a weighted formula.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
];

const platforms = [
  { name: "LeetCode", color: "#ffa116", weight: "30%" },
  { name: "Codeforces", color: "#1f8dd6", weight: "40%" },
  { name: "CodeChef", color: "#6b3a2a", weight: "30%" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass border-b border-border/40 overflow-visible">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
              <Code2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg gradient-text hidden sm:block">LeadMedicaps</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" variant="gradient" className="whitespace-nowrap">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm gap-2 border-primary/30">
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
              Medicaps University — Official CP Platform
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="gradient-text">Level Up</span> Your
            <br />
            Coding Journey
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Track your competitive programming performance across LeetCode,
            Codeforces, and CodeChef. Compete with fellow Medicaps students on
            the official leaderboard.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/signup">
              <Button size="xl" variant="gradient" className="gap-2 w-full sm:w-auto">
                Start Competing
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button size="xl" variant="outline" className="gap-2 w-full sm:w-auto">
                <Trophy className="h-5 w-5 text-yellow-400" />
                View Leaderboard
              </Button>
            </Link>
          </motion.div>

          {/* Platform badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-center gap-3 mt-12 flex-wrap"
          >
            {platforms.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-border/40 text-sm"
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: p.color }}
                />
                <span>{p.name}</span>
                <Badge variant="outline" className="text-xs py-0 px-2">
                  {p.weight}
                </Badge>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to{" "}
              <span className="gradient-text">dominate</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Built exclusively for Medicaps University students
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-default"
                >
                  <div
                    className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CP Score Formula */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold mb-3">
              How the <span className="gradient-text">CP Score</span> Works
            </h2>
            <p className="text-muted-foreground text-sm">
              Each platform rating is normalised independently to 0–100, then combined with weighted averaging.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border/50 glass p-4 sm:p-8 space-y-6"
          >
            {/* LeetCode */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ffa116]" />
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">LeetCode</span>
                <span className="ml-auto text-xs text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">weight 30%</span>
              </div>
              <div className="overflow-x-auto">
                <div className="bg-[#ffa116]/5 border border-[#ffa116]/20 rounded-xl px-4 py-4 flex items-center gap-2 min-w-max sm:min-w-0">
                  <span className="font-semibold text-[#ffa116] text-sm font-mono italic">lc</span>
                  <span className="text-muted-foreground text-lg">=</span>
                  <span className="text-foreground font-mono text-sm">clamp(0,</span>
                  <div className="flex flex-col items-center mx-1 gap-0.5">
                    <span className="text-foreground font-mono text-sm px-2 pb-0.5">contestRating − 1200</span>
                    <span className="block w-full h-[1.5px] bg-foreground/70 rounded-full" />
                    <span className="text-foreground font-mono text-sm px-2 pt-0.5">10</span>
                  </div>
                  <span className="text-foreground font-mono text-sm">, 100)</span>
                  <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap hidden sm:block pl-3">1200 → 0 · 2200 → 100</span>
                </div>
              </div>
            </div>

            {/* Codeforces */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#1f8dd6]" />
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Codeforces</span>
                <span className="ml-auto text-xs text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">weight 40%</span>
              </div>
              <div className="overflow-x-auto">
                <div className="bg-[#1f8dd6]/5 border border-[#1f8dd6]/20 rounded-xl px-4 py-4 flex items-center gap-2 min-w-max sm:min-w-0">
                  <span className="font-semibold text-[#1f8dd6] text-sm font-mono italic">cf</span>
                  <span className="text-muted-foreground text-lg">=</span>
                  <span className="text-foreground font-mono text-sm">clamp(0,</span>
                  <div className="flex flex-col items-center mx-1 gap-0.5">
                    <span className="text-foreground font-mono text-sm px-2 pb-0.5">rating</span>
                    <span className="block w-full h-[1.5px] bg-foreground/70 rounded-full" />
                    <span className="text-foreground font-mono text-sm px-2 pt-0.5">20</span>
                  </div>
                  <span className="text-foreground font-mono text-sm">, 100)</span>
                  <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap hidden sm:block pl-3">0 → 0 · 2000 → 100</span>
                </div>
              </div>
            </div>

            {/* CodeChef */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">CodeChef</span>
                <span className="ml-auto text-xs text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">weight 30%</span>
              </div>
              <div className="overflow-x-auto">
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-4 flex items-center gap-2 min-w-max sm:min-w-0">
                  <span className="font-semibold text-orange-400 text-sm font-mono italic">cc</span>
                  <span className="text-muted-foreground text-lg">=</span>
                  <span className="text-foreground font-mono text-sm">clamp(0,</span>
                  <div className="flex flex-col items-center mx-1 gap-0.5">
                    <span className="text-foreground font-mono text-sm px-2 pb-0.5">rating − 1000</span>
                    <span className="block w-full h-[1.5px] bg-foreground/70 rounded-full" />
                    <span className="text-foreground font-mono text-sm px-2 pt-0.5">15</span>
                  </div>
                  <span className="text-foreground font-mono text-sm">, 100)</span>
                  <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap hidden sm:block pl-3">1000 → 0 · 2500 → 100</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border/60 pt-6">
              {/* Final formula */}
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Overall CP Score</span>
              </div>
              <div className="bg-primary/8 border border-primary/25 rounded-xl px-5 py-6">
                {/* Fraction layout */}
                <div className="flex items-center justify-center gap-3 font-mono">
                  <span className="text-primary font-bold text-base italic">CP</span>
                  <span className="text-muted-foreground text-lg">=</span>
                  {/* Fraction */}
                  <div className="flex flex-col items-center gap-1">
                    {/* Numerator */}
                    <div className="flex items-center flex-wrap justify-center gap-x-1.5 gap-y-1 text-sm pb-1">
                      <span className="text-[#ffa116] font-mono whitespace-nowrap">0.30 × lc</span>
                      <span className="text-muted-foreground">+</span>
                      <span className="text-[#1f8dd6] font-mono whitespace-nowrap">0.40 × cf</span>
                      <span className="text-muted-foreground">+</span>
                      <span className="text-orange-400 font-mono whitespace-nowrap">0.30 × cc</span>
                    </div>
                    {/* Division line */}
                    <span className="block w-full h-[2px] bg-foreground/60 rounded-full" />
                    {/* Denominator */}
                    <div className="text-foreground/70 font-mono text-xs pt-1">
                      sum of weights of linked platforms
                    </div>
                  </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-5">
                  Weights redistribute automatically if a platform is not linked &nbsp;·&nbsp; Tiebreaker: total problems solved
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-primary/20 p-6 sm:p-12 glass"
          >
            <h2 className="text-3xl font-bold mb-4">
              Ready to climb the ranks?
            </h2>
            <p className="text-muted-foreground mb-8">
              Sign in with your <strong>@medicaps.ac.in</strong> email to join the
              leaderboard.
            </p>
            <div className="flex gap-4 justify-center flex-col sm:flex-row">
              <Link href="/signup">
                <Button size="lg" variant="gradient" className="gap-2">
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            <span>LeadMedicaps — Medicaps University, Indore</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>Meet the Developer</span>
            <span className="opacity-30">·</span>
            <a
              href="https://www.linkedin.com/in/kushagra-joshi2707/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn
            </a>
            <a
              href="mailto:joshikushagra704@gmail.com"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true" fill="currentColor">
                <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              Gmail
            </a>
          </div>
          <p>© 2025 LeadMedicaps. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
