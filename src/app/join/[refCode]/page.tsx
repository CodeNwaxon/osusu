"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function JoinGroupPage() {
  const { refCode } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const q = query(collection(db, "groups"), where("refCode", "==", refCode));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setGroup({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() });
        } else {
          toast.error("Group not found");
        }
      } catch (error) {
        console.error("Error fetching group:", error);
      } finally {
        setLoading(false);
      }
    };
    if (refCode) fetchGroup();
  }, [refCode]);

  const handleJoin = async () => {
    if (!user) {
      toast.error("Please login first to join");
      router.push("/login");
      return;
    }
    setShowTrustModal(true);
  };

  const confirmJoin = async () => {
    setJoining(true);
    try {
      await addDoc(collection(db, `groups/${group.id}/members`), {
        userId: user!.uid,
        joinedAt: serverTimestamp(),
        paymentStatus: "pending"
      });
      toast.success("Successfully joined the group!");
      router.push(`/group/${group.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to join group");
    } finally {
      setJoining(false);
      setShowTrustModal(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading group details...</div>;
  if (!group) return <div className="p-8 text-center text-red-500">Invalid invite link</div>;

  return (
    <div className="container mx-auto py-10 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">{group.name}</CardTitle>
          <CardDescription>You've been invited to join this Osusu group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg border">
              <p className="text-sm text-muted-foreground">Contribution</p>
              <p className="text-xl font-bold">
                {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(group.amount)}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg border">
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="text-xl font-bold">{group.duration} Months</p>
            </div>
          </div>
          <div className="flex justify-between items-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <span className="font-medium text-orange-800">Admin Payout Charge</span>
            {group.payoutChargeType === "none" ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">No Fee</Badge>
            ) : (
              <Badge variant="destructive">
                {group.payoutChargeType === "fixed" 
                  ? `₦${group.payoutChargeValue} Fixed` 
                  : `${group.payoutChargeValue * 100}%`}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full text-lg h-14" onClick={handleJoin}>
            Join Group Now
          </Button>
        </CardFooter>
      </Card>

      {/* Trust Warning Modal */}
      {showTrustModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-xl max-w-md w-full space-y-6">
            <h2 className="text-2xl font-bold text-destructive">Wait! Read This</h2>
            <p className="text-lg">
              You will pay money <strong>directly</strong> to the admin's bank account. This app does <strong>NOT</strong> hold funds.
            </p>
            <p className="text-muted-foreground">
              Do you trust this person? By continuing, you acknowledge the risk.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" className="w-full" onClick={() => setShowTrustModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" className="w-full" onClick={confirmJoin} disabled={joining}>
                {joining ? "Joining..." : "I Understand"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
