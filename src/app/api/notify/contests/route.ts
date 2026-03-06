import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/firebase/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch upcoming contests
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const contestsRes = await fetch(`${baseUrl}/api/contests`);
  const contestsData = await contestsRes.json();

  if (!contestsData.contests?.length) {
    return NextResponse.json({ message: "No upcoming contests" });
  }

  // Fetch all user emails for notification (only medicaps.ac.in)
  const profilesSnap = await adminDb
    .collection("profiles")
    .where("email", ">=", "@medicaps.ac.in")
    .get();

  // Filter in code since Firestore doesn't support LIKE queries
  const profiles = profilesSnap.docs
    .map((d) => d.data() as { email?: string; name?: string })
    .filter((p) => p.email?.endsWith("@medicaps.ac.in"));

  if (!profiles.length) {
    return NextResponse.json({ message: "No users to notify" });
  }

  const upcoming = contestsData.contests.slice(0, 5);

  const emailBody = `
Hi there! 🚀

Upcoming Competitive Programming Contests this week:

${upcoming
  .map(
    (c: { platform: string; name: string; startTime: string; url: string }) =>
      `📌 [${c.platform.toUpperCase()}] ${c.name}
   📅 Starts: ${new Date(c.startTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
   🔗 ${c.url}
`
  )
  .join("\n")}

Stay sharp! — LeadMedicaps
https://leadmedicaps.medicaps.ac.in
  `.trim();

  // Log for now — integrate with Resend/Nodemailer in production
  console.log("Contest notification email:", emailBody);
  console.log(
    "Sending to:",
    profiles.map((p) => p.email)
  );

  return NextResponse.json({
    success: true,
    message: `Notifications queued for ${profiles.length} users`,
    contest_count: upcoming.length,
    preview: emailBody,
  });
}
