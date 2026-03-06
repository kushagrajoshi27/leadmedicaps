import { redirect } from "next/navigation";
import { getCurrentUserWithProfile } from "@/lib/firebase/server";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUserWithProfile();

  if (!user) redirect("/login");

  if (!profile?.setup_complete) {
    redirect("/setup");
  }

  // Normalize nullable fields to match DashboardClient's expected types
  const profileForClient = {
    ...profile!,
    name: profile!.name ?? "",
    username: profile!.username ?? "",
    batch: profile!.batch ?? 0,
  };

  return <DashboardClient profile={profileForClient} />;
}
