"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Send,
  Search,
  MessageSquare,
  ChevronLeft,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";
import { useMultiPresence, useUserOnline } from "@/hooks/usePresence";

interface MiniProfile {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface Conversation {
  partnerId: string;
  partner: MiniProfile;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface MessagesClientProps {
  currentUserId: string;
  currentProfile: MiniProfile | null;
  openWithProfile: MiniProfile | null;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function MessagesClient({
  currentUserId,
  openWithProfile,
}: MessagesClientProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<MiniProfile | null>(
    openWithProfile
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  // Presence: subscribe to all conversation partners + active partner
  const partnerIds = conversations.map((c) => c.partnerId);
  const onlineMap = useMultiPresence(partnerIds);
  const activePartnerOnline = useUserOnline(activePartner?.id);

  // Scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations ?? []);

        // If openWithProfile and not in list, add dummy entry so user can start chat
        if (openWithProfile) {
          const exists = (data.conversations ?? []).find(
            (c: Conversation) => c.partnerId === openWithProfile.id
          );
          if (!exists) {
            setConversations((prev) => [
              {
                partnerId: openWithProfile.id,
                partner: openWithProfile,
                lastMessage: "",
                lastAt: new Date().toISOString(),
                unread: 0,
              },
              ...prev,
            ]);
          }
        }
      }
    } finally {
      setLoadingConvs(false);
    }
  }, [openWithProfile]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for active conversation
  const loadMessages = useCallback(async (partnerId: string) => {
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/messages?with=${partnerId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  // Subscribe to real-time incoming messages via Firestore onSnapshot
  const subscribeToMessages = useCallback(
    (partnerId: string) => {
      // Unsubscribe from any existing listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }

      // Listen for messages sent BY the partner TO the current user
      const q = query(
        collection(db, "messages"),
        where("sender_id", "==", partnerId),
        where("receiver_id", "==", currentUserId),
        orderBy("created_at", "asc")
      );

      const unsub = onSnapshot(q, (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type === "added") {
            const newMsg = {
              id: change.doc.id,
              ...(change.doc.data() as Omit<Message, "id">),
            } as Message;
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        });
      });

      unsubscribeRef.current = unsub;
    },
    [currentUserId]
  );

  useEffect(() => {
    if (activePartner) {
      loadMessages(activePartner.id);
      subscribeToMessages(activePartner.id);
    }
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [activePartner, loadMessages, subscribeToMessages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activePartner || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    // Optimistic update
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: activePartner.id,
      content,
      created_at: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_id: activePartner.id,
          content,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? data.message : m))
        );
        // Refresh conversation list
        loadConversations();
      } else {
        // Revert optimistic on error
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        setInput(content);
      }
    } finally {
      setSending(false);
    }
  }, [input, activePartner, sending, currentUserId, loadConversations]);

  const filteredConvs = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.partner?.name?.toLowerCase().includes(q) ||
      c.partner?.username?.toLowerCase().includes(q) ||
      c.lastMessage?.toLowerCase().includes(q)
    );
  });

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const showChat = activePartner !== null;
  const showList = !isMobile || !showChat;

  return (
    <div className="flex border border-border/50 rounded-xl overflow-hidden bg-card/30 backdrop-blur-sm h-[calc(100dvh-180px)] sm:h-[calc(100vh-220px)] min-h-[480px]">
      {/* Conversation list */}
      <AnimatePresence>
        {(!showChat || !isMobile) && (
          <motion.div
            key="conv-list"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className={cn(
              "flex flex-col border-r border-border/50",
              showChat ? "hidden md:flex w-72 lg:w-80" : "flex flex-1 md:flex-none md:w-72 lg:w-80"
            )}
          >
            <div className="p-3 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {loadingConvs ? (
                <div className="space-y-3 p-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No conversations yet</p>
                  <p className="text-xs mt-1">
                    Visit someone&apos;s{" "}
                    <Link
                      href="/leaderboard"
                      className="underline text-primary"
                    >
                      profile
                    </Link>{" "}
                    to start chatting
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {filteredConvs.map((conv) => (
                    <button
                      key={conv.partnerId}
                      onClick={() => setActivePartner(conv.partner)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors",
                        activePartner?.id === conv.partnerId && "bg-primary/10"
                      )}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="h-10 w-10">
                          {conv.partner?.avatar_url ? (
                            <AvatarImage
                              src={conv.partner.avatar_url}
                              alt={conv.partner.name ?? ""}
                            />
                          ) : null}
                          <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                            {getInitials(conv.partner?.name ?? null)}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online dot */}
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background",
                            onlineMap.get(conv.partnerId)
                              ? "bg-emerald-500"
                              : "bg-muted-foreground/40"
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="font-medium text-sm truncate">
                            {conv.partner?.name ?? conv.partner?.username ?? "Unknown"}
                          </span>
                          {conv.lastAt && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatDistanceToNow(new Date(conv.lastAt), {
                                addSuffix: false,
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage || "No messages yet"}
                        </p>
                      </div>
                      {conv.unread > 0 && (
                        <span className="shrink-0 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                          {conv.unread}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      {showChat && activePartner ? (
        <motion.div
          key="chat-window"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col flex-1 min-w-0"
        >
          {/* Chat header */}
          <div className="flex items-center gap-3 p-3 border-b border-border/50 bg-card/50">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setActivePartner(null)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Avatar className="h-8 w-8">
                {activePartner.avatar_url ? (
                  <AvatarImage
                    src={activePartner.avatar_url}
                    alt={activePartner.name ?? ""}
                  />
                ) : null}
                <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  {getInitials(activePartner.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-background",
                  activePartnerOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {activePartner.name ?? activePartner.username}
              </p>
              <p className={cn(
                "text-xs",
                activePartnerOnline ? "text-emerald-500" : "text-muted-foreground"
              )}>
                {activePartnerOnline ? "Online" : activePartner.username ? `@${activePartner.username}` : "Offline"}
              </p>
            </div>
            <Button asChild variant="ghost" size="icon" className="h-8 w-8">
              <Link href={`/profile/${activePartner.username}`}>
                <User className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Messages area */}
          <ScrollArea className="flex-1 p-4">
            {loadingMsgs ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      i % 2 === 1 ? "justify-end" : "justify-start"
                    )}
                  >
                    <Skeleton
                      className={cn(
                        "h-9 rounded-2xl",
                        i % 2 === 1 ? "w-48" : "w-64"
                      )}
                    />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Say hello!</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {messages.map((msg, i) => {
                  const isMine = msg.sender_id === currentUserId;
                  const prevMsg = messages[i - 1];
                  const showTime =
                    !prevMsg ||
                    new Date(msg.created_at).getTime() -
                      new Date(prevMsg.created_at).getTime() >
                      5 * 60 * 1000;

                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <p className="text-center text-xs text-muted-foreground my-3">
                          {formatDistanceToNow(new Date(msg.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex",
                          isMine ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words",
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm"
                          )}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border/50 bg-card/50">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 text-sm h-10"
                disabled={sending}
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 shrink-0"
                disabled={!input.trim() || sending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </motion.div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="h-14 w-14 mx-auto mb-4 opacity-20" />
            <p className="text-base font-medium">Select a conversation</p>
            <p className="text-sm mt-1">
              Or{" "}
              <Link href="/leaderboard" className="underline text-primary">
                find someone
              </Link>{" "}
              to message
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
