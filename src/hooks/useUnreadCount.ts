"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

/**
 * Returns the total number of unread messages for the current user,
 * updated in real-time via Firestore onSnapshot.
 */
export function useUnreadCount(userId: string | undefined): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "messages"),
      where("receiver_id", "==", userId),
      where("read", "==", false)
    );

    const unsub = onSnapshot(q, (snap) => {
      setCount(snap.size);
    });

    return unsub;
  }, [userId]);

  return count;
}
