"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Mail, Send } from "lucide-react";

export default function ContactPage() {
  const { user } = useAuth();
  
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !phone || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "complaints"), {
        email,
        phone,
        message,
        uid: user?.uid || null,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      
      toast.success("Your message has been sent successfully!");
      if (!user) setEmail(""); // Only clear email if they aren't logged in
      setPhone("");
      setMessage("");
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-16 px-4 md:px-6 max-w-2xl">
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">Contact Support</h1>
        <p className="text-muted-foreground text-lg max-w-lg mx-auto">
          Have an issue or a question? Send us a message and our support team will get back to you shortly.
        </p>
      </div>

      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle>Send us a message</CardTitle>
          <CardDescription>All fields are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" /> Email Address
              </Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                readOnly={!!user?.email} // Make readonly if populated from auth
                className={!!user?.email ? "bg-muted" : ""}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" /> Phone Number
              </Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="+234 800 000 0000" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">How can we help?</Label>
              <textarea
                id="message"
                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe your issue or question in detail..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full text-lg h-12" disabled={submitting}>
              {submitting ? "Sending..." : (
                <span className="flex items-center gap-2">
                  <Send className="w-5 h-5" /> Send Message
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
