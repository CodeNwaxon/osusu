"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, deleteDoc, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MessageCircle, Trash2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Complaint {
  id: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  createdAt: any;
  uid: string | null;
}

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "complaints"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list: Complaint[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Complaint);
      });
      setComplaints(list);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast.error("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this complaint?")) return;
    try {
      await deleteDoc(doc(db, "complaints", id));
      setComplaints(complaints.filter(c => c.id !== id));
      toast.success("Complaint deleted successfully");
    } catch (error) {
      console.error("Error deleting complaint:", error);
      toast.error("Failed to delete complaint");
    }
  };

  const cleanPhoneForWhatsApp = (phone: string) => {
    // Remove spaces, dashes, parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, "");
    // If starts with 0 and 11 digits (e.g. 080...), replace with +234
    if (cleaned.startsWith("0") && cleaned.length === 11) {
      cleaned = "+234" + cleaned.substring(1);
    }
    // Remove '+' for whatsapp URL
    return cleaned.replace("+", "");
  };

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-primary" /> User Complaints
        </h1>
        <p className="text-muted-foreground mt-1">Review and respond to messages from the Contact Us page.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {complaints.map(complaint => (
            <Card key={complaint.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-base break-all flex items-center gap-2">
                      <Mail className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <a href={`mailto:${complaint.email}`} className="hover:underline hover:text-primary">
                        {complaint.email}
                      </a>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 text-sm text-foreground">
                      <Phone className="w-4 h-4 shrink-0 text-muted-foreground" />
                      <a href={`tel:${complaint.phone}`} className="hover:underline hover:text-primary">
                        {complaint.phone}
                      </a>
                    </CardDescription>
                  </div>
                  {complaint.uid && <Badge variant="secondary" className="text-[10px]">Registered User</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-wrap text-muted-foreground border">
                  {complaint.message}
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t flex items-center justify-between">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {complaint.createdAt?.toDate ? formatDistanceToNow(complaint.createdAt.toDate(), { addSuffix: true }) : "Recently"}
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={`https://wa.me/${cleanPhoneForWhatsApp(complaint.phone)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 h-9 px-3"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                  </a>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(complaint.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
          {complaints.length === 0 && (
            <div className="col-span-full text-center py-20 bg-muted/20 border border-dashed rounded-xl">
              <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-muted-foreground">No complaints found.</h3>
              <p className="text-sm text-muted-foreground">When users contact you, their messages will appear here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
