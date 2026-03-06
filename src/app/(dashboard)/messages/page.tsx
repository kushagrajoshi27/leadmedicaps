import { redirect } from "next/navigation";
import { getCurrentUser, getProfileById } from "@/lib/firebase/server";
import MessagesClient from "@/components/messages/messages-client";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { user: targetUserId } = await searchParams;

  // Fetch current user's profile (narrow to MiniProfile shape)
  const fullProfile = await getProfileById(user.uid);
  const currentProfile = fullProfile
    ? {
        id: fullProfile.id,
        name: fullProfile.name ?? null,
        username: fullProfile.username ?? null,
        avatar_url: fullProfile.avatar_url ?? null,
      }
    : null;

  // If ?user=ID param, preload that user's profile for opening conversation
  let openWithProfile = null;
  if (targetUserId && targetUserId !== user.uid) {
    const op = await getProfileById(targetUserId);
    openWithProfile = op
      ? {
          id: op.id,
          name: op.name ?? null,
          username: op.username ?? null,
          avatar_url: op.avatar_url ?? null,
        }
      : null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold gradient-text mb-1">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Direct messages with fellow Medicaps coders
        </p>
      </div>
      <MessagesClient
        currentUserId={user.uid}
        currentProfile={currentProfile}
        openWithProfile={openWithProfile}
      />
    </div>
  );
}
