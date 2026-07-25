"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Save } from "lucide-react";

export default function AdminTermsPage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "terms", "latest"));
      if (docSnap.exists()) {
        setContent(docSnap.data().content || "");
      }
    } catch (error) {
      console.error("Error fetching terms:", error);
      toast.error("Failed to load Terms & Conditions");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "terms", "latest"), {
        content,
        updatedAt: new Date().toISOString()
      });
      toast.success("Terms & Conditions saved successfully");
    } catch (error) {
      console.error("Error saving terms:", error);
      toast.error("Failed to save terms");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> Terms & Conditions
          </h1>
          <p className="text-muted-foreground mt-1">Manage the platform&apos;s Terms of Service.</p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading}>
          <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Terms of Service Content</CardTitle>
          <CardDescription>Enter the content for the terms and conditions page. You can use simple Markdown or text formatting.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 animate-pulse bg-muted rounded-md" />
          ) : (
            <textarea
              className="flex min-h-[500px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
              placeholder="1. Introduction..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
