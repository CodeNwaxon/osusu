"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, doc, getDoc, serverTimestamp, query, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Send, RefreshCw, Trash2, Lock, Image, Link as LinkIcon, Eye, EyeOff } from "lucide-react";

interface BroadcastRecord {
  id: string;
  title: string;
  message: string;
  link?: string;
  buttonText?: string;
  imageUrl?: string;
  createdAt: any;
}

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sending, setSending] = useState(false);

  // CEO password verification
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Broadcast history
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Auto welcome message
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [savingWelcome, setSavingWelcome] = useState(false);

  // Action state
  const [pendingAction, setPendingAction] = useState<"send" | "delete" | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchBroadcasts();
    fetchWelcomeMessage();
  }, []);

  const fetchWelcomeMessage = async () => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "global"));
      if (docSnap.exists() && docSnap.data().autoWelcomeMessage) {
        setWelcomeMessage(docSnap.data().autoWelcomeMessage);
      } else {
        setWelcomeMessage("Thanks for joining Osusu 9ja! Start by creating your own group or joining one with a referral link. Build trust, save together, and grow your wealth.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBroadcasts = async () => {
    setLoadingHistory(true);
    try {
      const q = query(collection(db, "broadcasts"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list: BroadcastRecord[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as BroadcastRecord);
      });
      setBroadcasts(list);
    } catch (error) {
      console.error("Error fetching broadcasts:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendClick = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    setPendingAction("send");
    setShowPasswordPrompt(true);
    setPasswordInput("");
  };

  const confirmAction = async () => {
    // Verify CEO password
    try {
      const settingsDoc = await getDoc(doc(db, "settings", "global"));
      const storedPassword = settingsDoc.exists()
        ? settingsDoc.data().ceoPassword || "prince2020"
        : "prince2020";

      if (passwordInput !== storedPassword) {
        toast.error("Incorrect CEO password. Action not authorized.");
        return;
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      toast.error("Failed to verify password.");
      return;
    }

    setShowPasswordPrompt(false);

    if (pendingAction === "send") {
      await executeSend();
    } else if (pendingAction === "delete" && pendingDeleteId) {
      await executeDelete(pendingDeleteId);
    }
  };

  const executeSend = async () => {
    setSending(true);

    try {
      const broadcastData: Record<string, any> = {
        title: title.trim(),
        message: message.trim(),
        createdAt: serverTimestamp(),
      };
      if (link.trim()) broadcastData.link = link.trim();
      if (buttonText.trim()) broadcastData.buttonText = buttonText.trim();
      if (imageUrl.trim()) broadcastData.imageUrl = imageUrl.trim();

      // Save to notifications collection (for all users)
      await addDoc(collection(db, "notifications"), {
        ...broadcastData,
        userId: "all",
      });

      // Save to broadcasts collection (for admin history)
      await addDoc(collection(db, "broadcasts"), broadcastData);

      toast.success("Broadcast sent to all users!");
      setTitle("");
      setMessage("");
      setLink("");
      setButtonText("");
      setImageUrl("");
      fetchBroadcasts();
    } catch (error) {
      console.error("Error sending broadcast:", error);
      toast.error("Failed to send broadcast.");
    } finally {
      setSending(false);
    }
  };

  const handleReuse = (broadcast: BroadcastRecord) => {
    setTitle(broadcast.title);
    setMessage(broadcast.message);
    setLink(broadcast.link || "");
    setButtonText(broadcast.buttonText || "");
    setImageUrl(broadcast.imageUrl || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info("Broadcast loaded into form. Edit and publish again.");
  };

  const handleDeleteClick = (id: string) => {
    setPendingAction("delete");
    setPendingDeleteId(id);
    setShowPasswordPrompt(true);
    setPasswordInput("");
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "broadcasts", id));
      setBroadcasts(broadcasts.filter(b => b.id !== id));
      toast.success("Broadcast deleted from history.");
    } catch (error) {
      console.error("Error deleting broadcast:", error);
      toast.error("Failed to delete broadcast.");
    }
  };

  const handleSaveWelcome = async () => {
    setSavingWelcome(true);
    try {
      const { setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "settings", "global"), { autoWelcomeMessage: welcomeMessage.trim() }, { merge: true });
      toast.success("Welcome message updated!");
    } catch (error) {
      toast.error("Failed to save welcome message");
    } finally {
      setSavingWelcome(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-primary" /> Broadcast Messages
        </h1>
        <p className="text-muted-foreground mt-1">Send notifications to all users on the platform.</p>
      </div>

      {/* Welcome Message Card */}
      <Card>
        <CardHeader>
          <CardTitle>Auto Welcome Message</CardTitle>
          <CardDescription>Edit the welcome notification new users receive when they sign up.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            className="min-h-[80px] resize-none flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
          />
          <Button onClick={handleSaveWelcome} disabled={savingWelcome} className="bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white rounded-full">
            {savingWelcome ? "Saving..." : "Update Message"}
          </Button>
        </CardContent>
      </Card>

      {/* Compose Card */}
      <Card>
        <CardHeader>
          <CardTitle>Compose Broadcast</CardTitle>
          <CardDescription>Fill in the details below. CEO password is required before sending.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Title *</label>
            <Input
              placeholder="e.g. New Feature Update"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Message *</label>
            <textarea
              placeholder="Write your broadcast message here..."
              className="min-h-[120px] resize-none flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5 ">
                <LinkIcon className="w-3.5 h-3.5" /> Link URL (optional)
              </label>
              <Input
                placeholder="https://example.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Button Text (optional)</label>
              <Input
                placeholder="e.g. Visit Us, Check This Out"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" /> Image URL (optional)
            </label>
            <Input
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          {imageUrl && (
            <div className="rounded-lg overflow-hidden border bg-muted max-w-xs">
              <img src={imageUrl} alt="Preview" className="w-full h-auto object-cover max-h-40" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}

          <Button onClick={handleSendClick} disabled={sending} className="w-full sm:w-auto bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white rounded-full px-8">
            {sending ? "Sending..." : (
              <>
                <Send className="w-4 h-4 mr-2" /> Send Broadcast
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Broadcast History */}
      <Card>
        <CardHeader>
          <CardTitle>Broadcast History</CardTitle>
          <CardDescription>Previously sent broadcasts. Click &quot;Reuse&quot; to send again.</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Megaphone className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No broadcasts sent yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcasts.map((b) => (
                <div key={b.id} className="p-4 border border-border/50 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{b.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.message}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {b.link && <Badge variant="secondary" className="text-[10px]">Has Link</Badge>}
                        {b.imageUrl && <Badge variant="secondary" className="text-[10px]">Has Image</Badge>}
                        {b.createdAt?.toDate && (
                          <span className="text-[10px] text-muted-foreground">
                            {b.createdAt.toDate().toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" className="text-xs" onClick={() => handleReuse(b)}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Reuse
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(b.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CEO Password Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-xl max-w-sm w-full space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">CEO Verification</h2>
                <p className="text-xs text-muted-foreground">Enter the CEO password to send this broadcast.</p>
              </div>
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter CEO password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="pr-10"
                onKeyDown={(e) => { if (e.key === "Enter") confirmAction(); }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={confirmAction} disabled={!passwordInput.trim()} className="w-full">
                <Send className="w-4 h-4 mr-2" /> {pendingAction === "delete" ? "Confirm Delete" : "Confirm & Send"}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setShowPasswordPrompt(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
