"use client";

import { useEffect, useState } from "react";
import {
  ref,
  set,
  onValue,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";
import { rtdb } from "@/lib/firebase/client";

/**
 * Sets up the current user's online presence in Firebase RTDB.
 * Call this once at the top of the authenticated layout (e.g. Navbar).
 */
export function useSetPresence(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const presenceRef = ref(rtdb, `/presence/${userId}`);

    set(presenceRef, { online: true, lastSeen: Date.now() });
    onDisconnect(presenceRef).set({ online: false, lastSeen: serverTimestamp() });

    return () => {
      set(presenceRef, { online: false, lastSeen: Date.now() });
    };
  }, [userId]);
}

/**
 * Subscribes to a single user's online status from RTDB.
 */
export function useUserOnline(userId: string | undefined): boolean {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const presenceRef = ref(rtdb, `/presence/${userId}`);
    const unsub = onValue(presenceRef, (snap) => {
      setOnline(snap.val()?.online === true);
    });
    return unsub;
  }, [userId]);

  return online;
}

/**
 * Subscribes to multiple users' online status and returns a uid → boolean map.
 */
export function useMultiPresence(userIds: string[]): Map<string, boolean> {
  const [onlineMap, setOnlineMap] = useState<Map<string, boolean>>(new Map());
  const key = userIds.slice().sort().join(",");

  useEffect(() => {
    if (!userIds.length) return;

    const unsubs = userIds.map((uid) => {
      const presRef = ref(rtdb, `/presence/${uid}`);
      return onValue(presRef, (snap) => {
        setOnlineMap((prev) => {
          const next = new Map(prev);
          next.set(uid, snap.val()?.online === true);
          return next;
        });
      });
    });

    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return onlineMap;
}
