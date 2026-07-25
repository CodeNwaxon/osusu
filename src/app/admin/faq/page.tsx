"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpCircle, Plus, Trash2, Save, X } from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function AdminFAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // New FAQ form state
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [adding, setAdding] = useState(false);

  // Confirm delete state
  const [deleteTarget, setDeleteTarget] = useState<FAQItem | null>(null);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "faq"));
      const faqList: FAQItem[] = [];
      snapshot.forEach(doc => {
        faqList.push({ id: doc.id, ...doc.data() } as FAQItem);
      });
      setFaqs(faqList);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFaq = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      toast.error("Please fill in both fields");
      return;
    }
    
    setAdding(true);
    try {
      const docRef = await addDoc(collection(db, "faq"), {
        question: newQuestion,
        answer: newAnswer,
        createdAt: new Date().toISOString()
      });
      
      setFaqs([...faqs, { id: docRef.id, question: newQuestion, answer: newAnswer }]);
      setNewQuestion("");
      setNewAnswer("");
      toast.success("FAQ added successfully");
    } catch (error) {
      console.error("Error adding FAQ:", error);
      toast.error("Failed to add FAQ");
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateFaq = async (id: string, question: string, answer: string) => {
    setSavingId(id);
    try {
      await setDoc(doc(db, "faq", id), { question, answer }, { merge: true });
      toast.success("FAQ updated successfully");
    } catch (error) {
      console.error("Error updating FAQ:", error);
      toast.error("Failed to update FAQ");
    } finally {
      setSavingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, "faq", deleteTarget.id));
      setFaqs(faqs.filter(f => f.id !== deleteTarget.id));
      toast.success("FAQ deleted successfully");
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast.error("Failed to delete FAQ");
    } finally {
      setDeleteTarget(null);
    }
  };

  const updateFaqState = (id: string, field: "question" | "answer", value: string) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-4xl mx-auto relative">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" /> Manage FAQ
        </h1>
        <p className="text-muted-foreground mt-1">Create and manage Frequently Asked Questions for the public site.</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>Add New FAQ</CardTitle>
          <CardDescription>Add a new question and answer to the public FAQ page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Question</Label>
            <Input 
              placeholder="e.g. How does Osusu 9ja work?" 
              value={newQuestion} 
              onChange={e => setNewQuestion(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Answer</Label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Detailed explanation..."
              value={newAnswer}
              onChange={e => setNewAnswer(e.target.value)}
            />
          </div>
          <Button onClick={handleAddFaq} disabled={adding} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" /> {adding ? "Adding..." : "Add FAQ"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-xl font-bold border-b pb-2">Existing FAQs</h2>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl"></div>)}
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map(faq => (
              <Card key={faq.id}>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Input 
                      value={faq.question} 
                      onChange={e => updateFaqState(faq.id, "question", e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Answer</Label>
                    <textarea
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={faq.answer}
                      onChange={e => updateFaqState(faq.id, "answer", e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(faq)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                    <Button size="sm" onClick={() => handleUpdateFaq(faq.id, faq.question, faq.answer)} disabled={savingId === faq.id}>
                      <Save className="w-4 h-4 mr-2" /> {savingId === faq.id ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {faqs.length === 0 && (
              <div className="text-center text-muted-foreground py-10 bg-muted/20 rounded-xl border border-dashed">
                No FAQs found. Add your first FAQ above.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-lg animate-in zoom-in-95">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <X className="w-5 h-5" /> Delete FAQ
              </CardTitle>
              <CardDescription>
                Are you sure you want to delete <strong className="text-foreground">&ldquo;{deleteTarget.question}&rdquo;</strong>? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete}>Yes, Delete</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
