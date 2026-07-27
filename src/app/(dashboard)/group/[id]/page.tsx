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
  deleteDoc,
  updateDoc,
  where,
  writeBatch
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
  Share2,
  Trash2,
  LogOut,
  Bell,
  Play
} from "lucide-react";
import { calculateExpectedPayout, PayoutChargeType } from "@/lib/calculations";
import { toast } from "sonner";

interface GroupData {
  id: string;
  name: string;
  amount: number;
  duration: number;
  totalMembers: number;
  paymentDay: number;
  payoutDay: number;
  payoutChargeType: PayoutChargeType;
  payoutChargeValue: number;
  creatorId: string;
  refCode: string;
  status: string;
  osusuStarted?: boolean;
  osusuStartDate?: any;
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

interface PayoutMonthData {
  id: string;
  month: number;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
}

export default function GroupDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [payoutMonths, setPayoutMonths] = useState<PayoutMonthData[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Real-time group listener
  useEffect(() => {
    if (!id || !user) return;
    const unsubGroup = onSnapshot(doc(db, "groups", id as string), (snap) => {
      if (!snap.exists()) {
        router.push("/dashboard");
        return;
      }
      setGroup({ id: snap.id, ...snap.data() } as GroupData);
    });

    return () => unsubGroup();
  }, [id, user, router]);

  // Real-time members listener
  useEffect(() => {
    if (!id || !user) return;
    const membersQuery = collection(db, `groups/${id}/members`);
    const unsubMembers = onSnapshot(membersQuery, async (snapshot) => {
      const membersList: MemberData[] = [];
      for (const memberDoc of snapshot.docs) {
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
      setMembers(membersList);
      setLoading(false);
    });

    return () => unsubMembers();
  }, [id, user]);

  // Real-time payout months listener
  useEffect(() => {
    if (!id || !user) return;
    const monthsQuery = collection(db, `groups/${id}/payoutMonths`);
    const unsubMonths = onSnapshot(monthsQuery, (snapshot) => {
      const list: PayoutMonthData[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as PayoutMonthData);
      });
      setPayoutMonths(list);
    });

    return () => unsubMonths();
  }, [id, user]);

  // Real-time chat listener with auto year-end cleanup
  useEffect(() => {
    if (!id || !user) return;

    const messagesQuery = query(
      collection(db, `groups/${id}/messages`),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      // Check for Dec 31 cleanup
      const now = new Date();
      const isDec31 = now.getMonth() === 11 && now.getDate() === 31;
      
      if (isDec31 && !snapshot.empty) {
        // Run cleanup
        const batch = writeBatch(db);
        snapshot.docs.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
        toast.success("Year-end group chat cleanup completed automatically!");
        setMessages([]);
        return;
      }

      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [id, user]);

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

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await deleteDoc(doc(db, `groups/${id}/messages`, msgId));
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm("Are you absolutely sure you want to permanently delete this group? This will wipe all chats, members, and payment history!")) return;
    try {
      setLoading(true);
      // Cascade delete members
      const membersSnap = await getDocs(collection(db, `groups/${id}/members`));
      for (const m of membersSnap.docs) {
        await deleteDoc(m.ref);
      }
      // Cascade delete messages
      const messagesSnap = await getDocs(collection(db, `groups/${id}/messages`));
      for (const m of messagesSnap.docs) {
        await deleteDoc(m.ref);
      }
      // Cascade delete payout months
      const monthsSnap = await getDocs(collection(db, `groups/${id}/payoutMonths`));
      for (const m of monthsSnap.docs) {
        await deleteDoc(m.ref);
      }
      // Cascade delete notifications
      const notifsSnap = await getDocs(collection(db, `groups/${id}/notifications`));
      for (const n of notifsSnap.docs) {
        await deleteDoc(n.ref);
      }
      // Delete group
      await deleteDoc(doc(db, "groups", id as string));
      toast.success("Group deleted successfully");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to delete group");
      setLoading(false);
    }
  };

  const handleExitGroup = async () => {
    if (!confirm("Are you sure you want to exit this group?")) return;
    try {
      setLoading(true);
      // Find member doc
      const memberQuery = query(collection(db, `groups/${id}/members`), where("userId", "==", user!.uid));
      const memberSnap = await getDocs(memberQuery);
      for (const m of memberSnap.docs) {
        await deleteDoc(m.ref);
      }
      // Remove selected payout months
      const monthsQuery = query(collection(db, `groups/${id}/payoutMonths`), where("userId", "==", user!.uid));
      const monthsSnap = await getDocs(monthsQuery);
      for (const m of monthsSnap.docs) {
        await deleteDoc(m.ref);
      }
      toast.success("Exited group successfully");
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to exit group");
      setLoading(false);
    }
  };

  const handleStartOsusu = async () => {
    if (!group) return;
    try {
      await updateDoc(doc(db, "groups", group.id), {
        osusuStarted: true,
        osusuStartDate: serverTimestamp()
      });
      toast.success("Osusu started officially! Schedules and reminders are now active.");
    } catch (error) {
      toast.error("Failed to start Osusu");
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

  const isCreator = group.creatorId === user?.uid;
  const isCurrentlyMember = members.some(m => m.userId === user?.uid);

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

  const inviteLink = `${typeof window !== "undefined" ? window.location.origin : ""}/join/${group.refCode}`;

  const shareViaWhatsApp = () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent("Join our Osusu savings group: " + inviteLink)}`, "_blank");
  const shareViaFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`, "_blank");
  const shareViaX = () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent("Join our Osusu savings group")}`, "_blank");
  const shareViaTelegram = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent("Join our Osusu savings group")}`, "_blank");
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link copied to clipboard!");
  };
  const triggerNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: group.name,
          text: `Join our Osusu group: ${group.name}`,
          url: inviteLink
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      copyInviteLink();
    }
  };

  const expectedPayout = calculateExpectedPayout(
    group.amount,
    group.totalMembers,
    group.payoutChargeType || "none",
    group.payoutChargeValue || 0
  );

  // Check if December notice should be displayed (Dec 14-31)
  const now = new Date();
  const showDecNotice = now.getMonth() === 11 && now.getDate() >= 14 && now.getDate() <= 31;

  // Check notifications for Payment & Payout reminders
  const activeReminders: string[] = [];
  if (group.osusuStarted && group.osusuStartDate) {
    const paymentDay = group.paymentDay || 1;
    const payoutDay = group.payoutDay || 4;

    // Monthly deadlines client-side notifications
    const daysToPayment = paymentDay - now.getDate();
    const daysToPayout = payoutDay - now.getDate();

    if (daysToPayment > 0 && daysToPayment <= 5) {
      activeReminders.push(`Payment Reminder: ${daysToPayment} days left until Payment Day (${paymentDay}th).`);
    } else if (daysToPayment === 0) {
      activeReminders.push(`Payment Reminder: Today is Payment Day (${paymentDay}th). Please make your payments.`);
    }

    if (daysToPayout > 0 && daysToPayout <= 5) {
      activeReminders.push(`Payout Reminder: ${daysToPayout} days left until Payout Day (${payoutDay}th).`);
    } else if (daysToPayout === 0) {
      activeReminders.push(`Payout Reminder: Today is Payout Day (${payoutDay}th).`);
    }
  }

  const allMonthsAssigned = payoutMonths.length === group.duration;
  const isGroupFull = members.length === group.totalMembers;
  const showStartOsusuBtn = isCreator && isGroupFull && allMonthsAssigned && !group.osusuStarted;

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
                onClick={() => setShowShareModal(true)}
              >
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setShowMembers(!showMembers)}
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Group Info
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 md:px-6 py-4 flex flex-col lg:flex-row gap-4">
        {/* Members/Group Info Panel */}
        <div
          className={`
          lg:w-80 lg:shrink-0 lg:block
          ${showMembers ? "block" : "hidden lg:block"}
          transition-all duration-300
        `}
        >
          {/* Group Details */}
          <Card className="mb-4 border-border/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-primary/5 to-orange-500/5 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Banknote className="h-4 w-4 text-primary" />
                Group Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Contribution</span>
                <span className="font-bold text-sm text-foreground">
                  {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(group.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Payment Day
                </span>
                <span className="text-sm font-medium">{group.paymentDay || 1}th</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Payout Day
                </span>
                <span className="text-sm font-medium">{group.payoutDay}th</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Expected Payout</span>
                <span className="font-bold text-sm text-primary">
                  {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(expectedPayout)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Duration</span>
                <span className="text-sm font-medium">{group.duration} Months</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Fee</span>
                {group.payoutChargeType === "none" ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 text-[10px]">
                    No Fee
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-[10px]">
                    {group.payoutChargeType === "fixed" ? `₦${group.payoutChargeValue}` : `${group.payoutChargeValue * 100}%`}
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

          {/* Month Assignments */}
          <Card className="mb-4 border-border/30 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-primary/5 to-orange-500/5 pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Month Assignments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 max-h-64 overflow-y-auto">
              {Array.from({ length: group.duration }).map((_, idx) => {
                const monthNum = idx + 1;
                const assignment = payoutMonths.find(m => m.month === monthNum);

                return (
                  <div key={monthNum} className="border-b border-border/40 pb-2 last:border-0 last:pb-0">
                    <p className="text-xs font-semibold text-foreground">Month {monthNum}</p>
                    {assignment ? (
                      <div className="mt-1">
                        <p className="text-xs font-medium text-primary">
                          {assignment.userId === user?.uid ? user.displayName?.split(" ")[0] : assignment.userName.split(" ")[0]}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{assignment.userEmail}</p>
                        <p className="text-[10px] font-bold text-foreground">₦{Number(assignment.amount).toLocaleString()}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">None</p>
                    )}
                  </div>
                );
              })}
              <div className="border-t border-border/40 pt-2 flex justify-between items-center text-sm font-bold">
                <span>{allMonthsAssigned ? "Grand Total" : "Expected Grand Total"}</span>
                <span className="text-primary">₦{(group.amount * group.totalMembers).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Members List Card */}
          <Card className="border-border/30 overflow-hidden mb-4">
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
              </div>
            </CardContent>
          </Card>

          {/* Operations Card */}
          <Card className="border-border/30 p-4 space-y-3">
            {showStartOsusuBtn && (
              <Button onClick={handleStartOsusu} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full">
                <Play className="h-4 w-4 mr-2" /> Start Osusu
              </Button>
            )}
            {isCreator && (
              <Button onClick={handleDeleteGroup} variant="destructive" className="w-full rounded-full">
                <Trash2 className="h-4 w-4 mr-2" /> Delete Group
              </Button>
            )}
            {isCurrentlyMember && (
              <Button onClick={handleExitGroup} variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive/5 rounded-full">
                <LogOut className="h-4 w-4 mr-2" /> Exit Group
              </Button>
            )}
          </Card>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Active Notifications / Reminders Banners */}
          {activeReminders.map((reminder, rIdx) => (
            <div key={rIdx} className="mb-2 p-3 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs flex items-center gap-2">
              <Bell className="h-4 w-4 shrink-0" />
              <span>{reminder}</span>
            </div>
          ))}

          {showDecNotice && (
            <div className="mb-2 p-3 bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-300 rounded-xl text-xs font-semibold">
              Group chat history will be cleared on December 31st to maintain system efficiency.
            </div>
          )}

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
                          className={`flex mb-3 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[80%] md:max-w-[65%] relative group ${isMe ? "order-1" : "order-2"}`}>
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
                                rounded-2xl px-2 py-1.5 shadow-sm text-xs md:text-sm md:px-4 md:py-2.5 relative
                                ${isMe ? "bg-gradient-to-br from-primary to-orange-500 text-white rounded-br-md" : "bg-muted/80 border border-border/30 text-foreground rounded-bl-md"}
                              `}
                            >
                              <p className="leading-relaxed break-words pr-6">
                                {msg.text}
                              </p>
                              
                              {isMe && (
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="absolute top-2 right-2 text-white/75 hover:text-white transition-colors cursor-pointer"
                                  title="Delete Message"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}

                              <p
                                className={`text-[10px] mt-1 ${isMe ? "text-white/70 text-right" : "text-muted-foreground text-right"}`}
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

      {/* Share Group Invitation Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-xl max-w-md w-full space-y-6">
            <div>
              <h2 className="text-xl font-bold">Share Group Invitation</h2>
              <p className="text-xs text-muted-foreground mt-1">Invite others to join this Osusu group.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full text-xs font-semibold" onClick={shareViaWhatsApp}>WhatsApp</Button>
              <Button variant="outline" className="w-full text-xs font-semibold" onClick={shareViaFacebook}>Facebook</Button>
              <Button variant="outline" className="w-full text-xs font-semibold" onClick={shareViaX}>X (Twitter)</Button>
              <Button variant="outline" className="w-full text-xs font-semibold" onClick={shareViaTelegram}>Telegram</Button>
            </div>

            <Button className="w-full bg-primary text-white hover:bg-primary/95" onClick={triggerNativeShare}>
              Copy Link / Native Share
            </Button>
            
            <Button variant="outline" className="w-full" onClick={() => setShowShareModal(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
