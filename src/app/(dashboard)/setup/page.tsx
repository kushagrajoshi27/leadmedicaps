"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Linkedin,
  Code2,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  ChevronsUpDown,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { toast } from "sonner";

const BATCH_YEARS = Array.from({ length: 12 }, (_, i) => 2018 + i);

const BRANCHES = [
  "B.A LLB (Hons)",
  "B.B.A LLB (Hons)",
  "B.Com (Hons)",
  "B.Com (Hons.) Global Finance with ACCA",
  "B.Sc Hons in Agriculture",
  "B.Sc Hons in Forensic Science",
  "B.Sc in Biotechnology",
  "B.Sc in Forensic Science",
  "B.Tech - Automobile Engineering (Electric Vehicle)",
  "B.Tech - Computer Science and Engineering",
  "B.Tech - M.Tech Computer Science & Engineering",
  "B.Tech - Robotics and Automation Engineering",
  "B.Tech AU/EV - Automobile Engineering (Electric Vehicle)",
  "B.Tech CE - Civil Engineering",
  "B.Tech CSE - Advanced Artificial Intelligence",
  "B.Tech CSE - Artificial Intelligence",
  "B.Tech CSE - Artificial Intelligence & Analytics",
  "B.Tech CSE - Artificial Intelligence and Machine Learning",
  "B.Tech CSE - Cyber Security",
  "B.Tech CSE - Data Science",
  "B.Tech CSE - Internet of Things",
  "B.Tech CSE - Networks",
  "B.Tech CSBS - Computer Science and Business Systems",
  "B.Tech ECE - Electronics & Communication Engineering",
  "B.Tech EE - Electrical Engineering",
  "B.Tech IT - Information Technology",
  "B.Tech Mechanical Engineering",
  "B.Tech RA - Robotics and Automation",
  "BBA LLB (Hons)",
  "BBA in Business Analytics",
  "BBA in Digital Marketing",
  "BBA in Finance",
  "BBA in Foreign Trade",
  "BBA in Human Resource",
  "BBA in Marketing Management",
  "Bachelor of Computer Applications",
  "Bachelor of Laws (Honours)",
  "Bachelor of Pharmacy",
  "M.A English",
  "M.Sc Agriculture (Agronomy)",
  "M.Sc Chemistry",
  "M.Sc Forensic Science",
  "M.Sc Mathematics",
  "M.Sc Physics",
  "M.Tech Civil Engineering",
  "M.Tech Electrical Engineering",
  "M.Tech Electronics and Communication",
  "M.Tech in Computer Science and Engineering",
  "M.Tech Mechanical Engineering",
  "M.Tech Nanotechnology",
  "MBA in Business Analytics",
  "MBA in Finance",
  "MBA in Foreign Trade",
  "MBA in Human Resource",
  "MBA in Logistic and Supply Chain Management",
  "MBA in Marketing Management",
  "Master of Computer Applications",
  "Master of Pharmacy",
  "Ph.D in Agriculture",
  "Ph.D in Arts, Humanities & Social Science",
  "Ph.D in Chemistry",
  "Ph.D in Commerce",
  "Ph.D in Computer Applications",
  "Ph.D in Computer Science",
  "Ph.D in Engineering",
  "Ph.D in Management",
  "Ph.D in Mathematics",
  "Ph.D in Pharmacy",
];

const steps = [
  {
    id: 1,
    title: "Personal Details",
    desc: "Let's start with your basic information",
    icon: User,
  },
  {
    id: 2,
    title: "Coding Platforms",
    desc: "Connect your competitive programming accounts",
    icon: Code2,
  },
  {
    id: 3,
    title: "All Set!",
    desc: "Your profile is ready",
    icon: Check,
  },
];

export default function SetupProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    username: "",
    batch: "",
    branch: "",
    linkedin_url: "",
    leetcode_username: "",
    codeforces_username: "",
    codechef_username: "",
  });

  const [branchOpen, setBranchOpen] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");
  const branchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setBranchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBranches = BRANCHES.filter((b) =>
    b.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!form.name.trim()) { toast.error("Name is required"); return; }
      if (!form.username.trim()) { toast.error("Username is required"); return; }
      if (!/^[a-z0-9_]{3,20}$/.test(form.username)) {
        toast.error("Username must be 3-20 chars: lowercase, numbers, underscores only");
        return;
      }
      if (!form.batch) { toast.error("Please select your batch year"); return; }
      if (!form.branch) { toast.error("Please select your branch"); return; }
    }
    if (step < 2) setStep((s) => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);

    const user = auth.currentUser;
    if (!user) { router.push("/login"); return; }

    try {
      const profileRef = doc(db, "profiles", user.uid);
      await updateDoc(profileRef, {
        name: form.name,
        username: form.username,
        batch: parseInt(form.batch),
        branch: form.branch,
        linkedin_url: form.linkedin_url || null,
        leetcode_username: form.leetcode_username || null,
        codeforces_username: form.codeforces_username || null,
        codechef_username: form.codechef_username || null,
        setup_complete: true,
        updated_at: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save profile";
      if (msg.includes("already") || msg.includes("username")) {
        toast.error("Username is already taken. Choose another.");
      } else {
        toast.error(msg);
      }
      setLoading(false);
      return;
    }

    // Refresh CP stats in background
    const hasCPAccounts =
      form.leetcode_username || form.codeforces_username || form.codechef_username;

    if (hasCPAccounts) {
      try {
        await fetch("/api/cp/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leetcode_username: form.leetcode_username,
            codeforces_username: form.codeforces_username,
            codechef_username: form.codechef_username,
          }),
        });
      } catch { /* non-critical */ }
    }

    setLoading(false);
    setStep(3);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Code2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold gradient-text">LeadMedicaps</span>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center mb-10 gap-0">
          {steps.slice(0, 2).map((s, i) => (
            <div key={s.id} className="flex items-center">
              <motion.div
                animate={{
                  scale: step === s.id ? 1.1 : 1,
                  backgroundColor:
                    step > s.id
                      ? "hsl(239 84% 67%)"
                      : step === s.id
                      ? "hsl(239 84% 67%)"
                      : "hsl(var(--muted))",
                }}
                className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold text-white transition-all"
              >
                {step > s.id ? <Check className="h-4 w-4" /> : s.id}
              </motion.div>
              {i < 1 && (
                <div
                  className={`w-16 h-0.5 transition-colors duration-300 ${
                    step > s.id ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="glass border border-border/60 rounded-2xl p-6 sm:p-8 shadow-2xl"
        >
          {/* Step 3 - Success */}
          {step === 3 ? (
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                className="h-20 w-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="h-10 w-10 text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Profile Created! 🎉</h2>
              <p className="text-muted-foreground">
                Redirecting you to your dashboard...
              </p>
              <div className="mt-6">
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-1">
                  {steps[step - 1].title}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {steps[step - 1].desc}
                </p>
              </div>

              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      placeholder="John Doe"
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Username *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        @
                      </span>
                      <Input
                        placeholder="johndoe"
                        value={form.username}
                        onChange={(e) =>
                          updateForm("username", e.target.value.toLowerCase())
                        }
                        className="pl-7"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      3-20 characters, lowercase letters, numbers, underscores
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Batch (Year of Passing) *</Label>
                    <Select
                      value={form.batch}
                      onValueChange={(v) => updateForm("batch", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your batch year" />
                      </SelectTrigger>
                      <SelectContent>
                        {BATCH_YEARS.map((y) => (
                          <SelectItem key={y} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 relative" ref={branchRef}>
                    <Label>Branch *</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setBranchOpen((o) => !o);
                        setBranchSearch("");
                      }}
                      className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10"
                    >
                      <span className={form.branch ? "text-foreground" : "text-muted-foreground"}>
                        {form.branch || "Select your branch"}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </button>
                    {branchOpen && (
                      <div className="absolute z-50 w-full rounded-md border border-border bg-popover shadow-lg">
                        <div className="flex items-center border-b border-border px-3 py-2 gap-2">
                          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                          <input
                            autoFocus
                            placeholder="Search branch..."
                            value={branchSearch}
                            onChange={(e) => setBranchSearch(e.target.value)}
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto py-1">
                          {filteredBranches.length === 0 ? (
                            <p className="py-2 px-3 text-sm text-muted-foreground">
                              No branches found.
                            </p>
                          ) : (
                            filteredBranches.map((branch) => (
                              <button
                                key={branch}
                                type="button"
                                onClick={() => {
                                  updateForm("branch", branch);
                                  setBranchOpen(false);
                                  setBranchSearch("");
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors ${
                                  form.branch === branch
                                    ? "bg-accent/70 font-medium"
                                    : ""
                                }`}
                              >
                                {branch}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>LinkedIn Profile (Optional)</Label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={form.linkedin_url}
                        onChange={(e) => updateForm("linkedin_url", e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="rounded-lg bg-muted/50 border border-border/50 p-3 text-sm text-muted-foreground mb-2">
                    💡 Add at least one platform to appear on the leaderboard. You can update these anytime.
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-sm bg-[#ffa116] inline-flex items-center justify-center text-black text-xs font-bold">L</span>
                      LeetCode Username
                    </Label>
                    <Input
                      placeholder="e.g. john_doe"
                      value={form.leetcode_username}
                      onChange={(e) => updateForm("leetcode_username", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-sm bg-[#1f8dd6] inline-flex items-center justify-center text-white text-xs font-bold">C</span>
                      Codeforces Handle
                    </Label>
                    <Input
                      placeholder="e.g. tourist"
                      value={form.codeforces_username}
                      onChange={(e) => updateForm("codeforces_username", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-sm bg-[#6b3a2a] inline-flex items-center justify-center text-white text-xs font-bold">C</span>
                      CodeChef Username
                    </Label>
                    <Input
                      placeholder="e.g. john_chef"
                      value={form.codechef_username}
                      onChange={(e) => updateForm("codechef_username", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setStep((s) => s - 1)}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="flex-1 gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : step === 2 ? (
                    <>
                      Save Profile
                      <Check className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
