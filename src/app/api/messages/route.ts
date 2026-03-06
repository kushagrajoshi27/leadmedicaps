import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/firebase/server";
import { adminDb } from "@/lib/firebase/admin";
import type { DocumentData } from "firebase-admin/firestore";

type MessageDoc = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
};

function docToMsg(id: string, data: DocumentData): MessageDoc {
  return {
    id,
    sender_id: data.sender_id as string,
    receiver_id: data.receiver_id as string,
    content: data.content as string,
    read: data.read as boolean,
    created_at: data.created_at as string,
  };
}

type ProfileSnippet = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
};

async function fetchProfileSnippets(
  uids: string[]
): Promise<Map<string, ProfileSnippet>> {
  const unique = [...new Set(uids)].filter(Boolean);
  if (!unique.length) return new Map();

  const refs = unique.map((uid) => adminDb.collection("profiles").doc(uid));
  const snaps = await adminDb.getAll(...refs);

  const map = new Map<string, ProfileSnippet>();
  snaps.forEach((s) => {
    if (s.exists) {
      const d = s.data() as DocumentData;
      map.set(s.id, {
        id: s.id,
        name: d.name ?? "",
        username: d.username ?? "",
        avatar_url: d.avatar_url ?? null,
      });
    }
  });
  return map;
}

// GET /api/messages?with=USER_ID  — load conversation with a user
// GET /api/messages               — load all conversations
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const withUserId = req.nextUrl.searchParams.get("with");

  if (withUserId) {
    // Load conversation — two queries (Firestore has no OR across different fields)
    const [sentSnap, receivedSnap] = await Promise.all([
      adminDb
        .collection("messages")
        .where("sender_id", "==", user.uid)
        .where("receiver_id", "==", withUserId)
        .orderBy("created_at", "asc")
        .get(),
      adminDb
        .collection("messages")
        .where("sender_id", "==", withUserId)
        .where("receiver_id", "==", user.uid)
        .orderBy("created_at", "asc")
        .get(),
    ]);

    const allDocs: MessageDoc[] = [
      ...sentSnap.docs.map((d) => docToMsg(d.id, d.data())),
      ...receivedSnap.docs.map((d) => docToMsg(d.id, d.data())),
    ].sort(
      (a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
    );

    const profileMap = await fetchProfileSnippets([user.uid, withUserId]);

    const messages = allDocs.map((m) => ({
      ...m,
      sender: profileMap.get(m.sender_id) ?? null,
      receiver: profileMap.get(m.receiver_id) ?? null,
    }));

    // Mark messages from the other user as read (batch update)
    const unreadDocs = receivedSnap.docs.filter((d) => !d.data().read);
    if (unreadDocs.length) {
      const batch = adminDb.batch();
      unreadDocs.forEach((d) => batch.update(d.ref, { read: true }));
      await batch.commit();
    }

    return NextResponse.json({ messages });
  }

  // Load all conversations (latest message per conversation partner)
  const [sentSnap, receivedSnap] = await Promise.all([
    adminDb
      .collection("messages")
      .where("sender_id", "==", user.uid)
      .orderBy("created_at", "desc")
      .get(),
    adminDb
      .collection("messages")
      .where("receiver_id", "==", user.uid)
      .orderBy("created_at", "desc")
      .get(),
  ]);

  type MsgWithPartner = MessageDoc & { partnerId: string; isSent: boolean };

  const sentMessages: MsgWithPartner[] = sentSnap.docs.map((d) => ({
    ...docToMsg(d.id, d.data()),
    partnerId: d.data().receiver_id as string,
    isSent: true,
  }));
  const receivedMessages: MsgWithPartner[] = receivedSnap.docs.map((d) => ({
    ...docToMsg(d.id, d.data()),
    partnerId: d.data().sender_id as string,
    isSent: false,
  }));

  const allMessages: MsgWithPartner[] = [...sentMessages, ...receivedMessages].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
  );

  // Collect unique partner IDs and batch-fetch their profiles
  const partnerIds = [...new Set(allMessages.map((m) => m.partnerId))];
  const profileMap = await fetchProfileSnippets(partnerIds);

  type ConvEntry = {
    partnerId: string;
    partner: ProfileSnippet | null;
    lastMessage: string;
    lastAt: string;
    unread: number;
  };

  const convMap = new Map<string, ConvEntry>();

  for (const msg of allMessages) {
    if (!convMap.has(msg.partnerId)) {
      convMap.set(msg.partnerId, {
        partnerId: msg.partnerId,
        partner: profileMap.get(msg.partnerId) ?? null,
        lastMessage: msg.content as string,
        lastAt: msg.created_at as string,
        unread: 0,
      });
    }
  }

  // Count unread from received
  for (const msg of receivedMessages) {
    if (!msg.read) {
      const existing = convMap.get(msg.partnerId);
      if (existing) existing.unread += 1;
    }
  }

  const conversations = Array.from(convMap.values());
  return NextResponse.json({ conversations });
}

// POST /api/messages  body: { receiver_id, content }
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { receiver_id, content } = body;

  if (!receiver_id || !content?.trim()) {
    return NextResponse.json(
      { error: "receiver_id and content are required" },
      { status: 400 }
    );
  }

  if (receiver_id === user.uid) {
    return NextResponse.json(
      { error: "Cannot message yourself" },
      { status: 400 }
    );
  }

  const docRef = await adminDb.collection("messages").add({
    sender_id: user.uid,
    receiver_id,
    content: content.trim(),
    read: false,
    created_at: new Date().toISOString(),
  });

  const newDoc = await docRef.get();
  return NextResponse.json(
    { message: { id: docRef.id, ...newDoc.data() } },
    { status: 201 }
  );
}

// ---- Old Supabase handlers removed below ----
// (Firebase migration complete)
