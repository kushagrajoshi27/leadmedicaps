import { redirect } from "next/navigation";
import { getCurrentUserWithProfile } from "@/lib/firebase/server";
import { Navbar } from "@/components/layout/navbar";
import type { UserProfile } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUserWithProfile();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile as UserProfile} />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
