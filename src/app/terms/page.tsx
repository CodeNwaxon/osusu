"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsPage() {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const docSnap = await getDoc(doc(db, "terms", "latest"));
        if (docSnap.exists() && docSnap.data().content) {
          setContent(docSnap.data().content);
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  return (
    <div className="container mx-auto py-16 px-4 md:px-6 max-w-4xl min-h-[70vh]">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent flex justify-center items-center gap-3">
          <FileText className="w-8 h-8 text-primary" /> Terms & Conditions
        </h1>
        <p className="text-muted-foreground text-lg">
          Please read these terms carefully before using our platform.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
        </div>
      ) : content ? (
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 md:p-10 prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap font-sans text-muted-foreground leading-relaxed">
            {content}
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-20 bg-muted/20 border border-dashed rounded-xl">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-muted-foreground">Terms & Conditions Unavailable</h3>
          <p className="text-sm text-muted-foreground">Please check back later.</p>
        </div>
      )}
    </div>
  );
}
