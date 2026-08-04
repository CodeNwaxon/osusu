"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/store/useAuth";
import { collection, query, where, onSnapshot, doc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, MailOpen, Inbox, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
// Simple relative time helper (avoids date-fns dependency)
function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

interface ContactMessage {
  id: string;
  type: string;
  groupId: string;
  groupName: string;
  senderEmail: string;
  senderPhone?: string;
  message: string;
  createdAt: any;
  isRead?: boolean;
}

export default function InboxPage() {
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    const q = query(
      collection(db, "notifications"),
      where("targetUserId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: ContactMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === "contact_creator") {
          msgs.push({ id: doc.id, ...data } as ContactMessage);
        }
      });
      // Sort in descending order of creation time
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inbox messages:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);


  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  const handleClearAll = async () => {
    if (!messages.length) return;
    if (!confirm("Are you sure you want to clear your entire inbox? This cannot be undone.")) return;

    try {
      const batch = writeBatch(db);
      messages.forEach((msg) => {
        const ref = doc(db, "notifications", msg.id);
        batch.delete(ref);
      });
      await batch.commit();
      toast.success("Inbox cleared successfully");
    } catch (error) {
      toast.error("Failed to clear inbox");
    }
  };

  if (authLoading) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Inbox className="w-8 h-8 text-primary" /> 
            Creator Inbox
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage requests from users wanting to join your private groups.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="destructive" onClick={handleClearAll} className="shrink-0">
            <Trash2 className="w-4 h-4 mr-2" /> Clear All
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse flex flex-col items-center gap-4 text-muted-foreground">
            <MailOpen className="w-12 h-12 opacity-20" />
            <p>Loading messages...</p>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-card/50 border border-border/50 rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Your inbox is empty</h3>
          <p className="text-muted-foreground max-w-sm">
            When users request to join your private groups, their messages will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {messages.map((msg) => (
            <Card key={msg.id} className="flex flex-col">
              <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
                <div className="flex justify-between items-start gap-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    {msg.groupName}
                  </Badge>
                  {msg.createdAt && msg.createdAt.toDate && (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {timeAgo(msg.createdAt.toDate())}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <a href={`mailto:${msg.senderEmail}`} className="hover:underline">{msg.senderEmail}</a>
                  </h4>
                  {msg.senderPhone && (
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      <a href={`tel:${msg.senderPhone}`} className="hover:underline">{msg.senderPhone}</a>
                    </h4>
                  )}
                </div>
                <div className="bg-muted/50 p-3 rounded-lg text-sm whitespace-pre-wrap">
                  {msg.message}
                </div>
              </CardContent>
              <CardFooter className="pt-0 justify-end">
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(msg.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
