"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Users,
  Banknote,
  Calendar,
  Crown,
  Mail,
  MessageCircle,
  User,
} from "lucide-react";

interface GroupData {
  id: string;
  name: string;
  amount: number;
  duration: number;
  totalMembers: number;
  payoutDay: number;
  payoutChargeType: string;
  payoutChargeValue: number;
  creatorId: string;
  refCode: string;
  status: string;
}

interface MemberData {
  userId: string;
  name?: string;
  email?: string;
  photoURL?: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  text: string;
  createdAt: any;
}

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch group info & members
  useEffect(() => {
    if (!id || !user) return;

    const fetchGroupData = async () => {
      try {
        const groupSnap = await getDoc(doc(db, "groups", id as string));
        if (!groupSnap.exists()) {
          router.push("/dashboard");
          return;
        }
        setGroup({ id: groupSnap.id, ...groupSnap.data() } as GroupData);

        // Fetch members from subcollection
        const membersSnap = await getDocs(
          collection(db, `groups/${id}/members`)
        );
        const membersList: MemberData[] = [];

        // Fetch user profiles for each member
        for (const memberDoc of membersSnap.docs) {
          const memberData = memberDoc.data();
          const userSnap = await getDoc(doc(db, "users", memberData.userId));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            membersList.push({
              userId: memberData.userId,
              name: userData.name || "Unknown",
              email: userData.email || "",
              photoURL: userData.photoURL || "",
            });
          } else {
            membersList.push({
              userId: memberData.userId,
              name: "Unknown User",
              email: "",
            });
          }
        }

        // Also add the creator if not already in members
        const creatorId = groupSnap.data().creatorId;
        if (!membersList.find((m) => m.userId === creatorId)) {
          const creatorSnap = await getDoc(doc(db, "users", creatorId));
          if (creatorSnap.exists()) {
            const creatorData = creatorSnap.data();
            membersList.unshift({
              userId: creatorId,
              name: creatorData.name || "Creator",
              email: creatorData.email || "",
              photoURL: creatorData.photoURL || "",
            });
          }
        }

        setMembers(membersList);
      } catch (error) {
        console.error("Error fetching group:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [id, user, router]);

  // Real-time chat listener
  useEffect(() => {
    if (!id || !user) return;

    const messagesQuery = query(
      collection(db, `groups/${id}/messages`),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [id, user]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !id) return;

    setSending(true);
    try {
      await addDoc(collection(db, `groups/${id}/messages`), {
        senderId: user.uid,
        senderName: user.displayName || "Anonymous",
        senderEmail: user.email || "",
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    return date.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-lg">
          Loading group...
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Group not found.</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; msgs: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const dateStr = formatDate(msg.createdAt) || "Now";
    const existing = groupedMessages.find((g) => g.date === dateStr);
    if (existing) {
      existing.msgs.push(msg);
    } else {
      groupedMessages.push({ date: dateStr, msgs: [msg] });
    }
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Group Header */}
      <div className="border-b border-border/40 bg-card/80 backdrop-blur-sm sticky top-16 z-40">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="h-9 w-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-lg md:text-xl font-bold text-foreground line-clamp-1">
                  {group.name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {members.length} member{members.length !== 1 ? "s" : ""} ·{" "}
                  {group.duration} months
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setShowMembers(!showMembers)}
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Members
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 md:px-6 py-4 flex flex-col lg:flex-row gap-4">
        {/* Members Panel (sidebar on desktop, slide-in on mobile) */}
        <div
          className={`
          lg:w-80 lg:shrink-0 lg:block
          ${showMembers ? "block" : "hidden lg:block"}
          transition-all duration-300
        `}
        >
          {/* Group Info Card */}
          <Card className="mb-4 border-border/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-primary/5 to-orange-500/5 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="h-4 w-4 text-primary" />
                Group Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Contribution
                </span>
                <span className="font-bold text-primary">
                  {new Intl.NumberFormat("en-NG", {
                    style: "currency",
                    currency: "NGN",
                  }).format(group.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Payout Day
                </span>
                <span className="text-sm font-medium">{group.payoutDay}th</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Duration</span>
                <span className="text-sm font-medium">
                  {group.duration} Months
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Fee</span>
                {group.payoutChargeType === "none" ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 text-[10px]">
                    No Fee
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-[10px]"
                  >
                    {group.payoutChargeType === "fixed"
                      ? `₦${group.payoutChargeValue}`
                      : `${group.payoutChargeValue * 100}%`}
                  </Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Ref Code</span>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {group.refCode}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Members List Card */}
          <Card className="border-border/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 pb-2">
              <div className="space-y-1">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={member.name}
                        className="h-9 w-9 rounded-full ring-2 ring-border/30 object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-foreground truncate">
                          {member.name}
                        </p>
                        {member.userId === group.creatorId && (
                          <Crown className="h-3 w-3 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-2.5 w-2.5 shrink-0" />
                        {member.email || "No email"}
                      </p>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No members yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col border-border/30 overflow-hidden">
            {/* Chat Header */}
            <CardHeader className="bg-gradient-to-r from-primary/5 to-orange-500/5 py-3 px-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Group Chat</CardTitle>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {messages.length} message{messages.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>

            {/* Messages Area */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ maxHeight: "calc(100vh - 360px)", minHeight: "300px" }}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-primary/40" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">
                    No messages yet
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Start the conversation! Say hello to your group members.
                  </p>
                </div>
              ) : (
                groupedMessages.map((dateGroup) => (
                  <div key={dateGroup.date}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-border/40" />
                      <span className="text-[10px] text-muted-foreground font-medium bg-background px-2">
                        {dateGroup.date}
                      </span>
                      <div className="flex-1 h-px bg-border/40" />
                    </div>

                    {dateGroup.msgs.map((msg) => {
                      const isMe = msg.senderId === user?.uid;

                      return (
                        <div
                          key={msg.id}
                          className={`flex mb-3 ${
                            isMe ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] md:max-w-[65%] ${
                              isMe ? "order-1" : "order-2"
                            }`}
                          >
                            {/* Sender Info */}
                            {!isMe && (
                              <div className="flex items-center gap-1.5 mb-1 ml-1">
                                <span className="text-xs font-semibold text-foreground">
                                  {msg.senderName}
                                </span>
                                <span className="text-[10px] text-muted-foreground">
                                  · {msg.senderEmail}
                                </span>
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div
                              className={`
                              rounded-2xl px-4 py-2.5 shadow-sm
                              ${
                                isMe
                                  ? "bg-gradient-to-br from-primary to-orange-500 text-white rounded-br-md"
                                  : "bg-muted/80 border border-border/30 text-foreground rounded-bl-md"
                              }
                            `}
                            >
                              <p className="text-sm leading-relaxed break-words">
                                {msg.text}
                              </p>
                              <p
                                className={`text-[10px] mt-1 ${
                                  isMe
                                    ? "text-white/70 text-right"
                                    : "text-muted-foreground text-right"
                                }`}
                              >
                                {formatTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-border/30 p-3 bg-card/50">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full bg-muted/50 border-border/40 focus:bg-background h-11"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="h-11 w-11 rounded-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-lg shadow-primary/20 p-0 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              {user && (
                <p className="text-[10px] text-muted-foreground mt-1.5 ml-2">
                  Sending as {user.displayName} ({user.email})
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
