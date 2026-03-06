import { notFound, redirect } from "next/navigation";
import { getCurrentUser, getProfileByUsername, getProfileById } from "@/lib/firebase/server";
import ProfileClient from "@/components/profile/profile-client";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { username } = await params;
  return {
    title: `${username} — LeadMedicaps`,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Fetch the profile by username
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();

  // Fetch current user's profile for username
  const currentProfile = await getProfileById(user.uid);

  const isOwnProfile = user.uid === profile.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ProfileClient
        profile={profile}
        currentUserId={user.uid}
        currentUsername={currentProfile?.username ?? ""}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}
