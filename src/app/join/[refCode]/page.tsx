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
import { calculateExpectedPayout } from "@/lib/calculations";

export default function JoinGroupPage() {
  const { refCode } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [occupiedMonths, setOccupiedMonths] = useState<number[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [hasMonthAssigned, setHasMonthAssigned] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const q = query(collection(db, "groups"), where("refCode", "==", refCode));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const groupData = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
          setGroup(groupData);

          // Check if current user is already a member
          if (user) {
            const memberQuery = query(
              collection(db, `groups/${groupData.id}/members`),
              where("userId", "==", user.uid)
            );
            const memberSnap = await getDocs(memberQuery);
            if (!memberSnap.empty) {
              setIsMember(true);
            }
          }

          // Fetch occupied months
          const monthsQuery = collection(db, `groups/${groupData.id}/payoutMonths`);
          const monthsSnap = await getDocs(monthsQuery);
          const occupied: number[] = [];
          let userHasMonth = false;
          monthsSnap.forEach((doc) => {
            const data = doc.data();
            occupied.push(data.month);
            if (user && data.userId === user.uid) {
              userHasMonth = true;
            }
          });
          setOccupiedMonths(occupied);
          setHasMonthAssigned(userHasMonth);
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
  }, [refCode, user]);

  const handleJoin = async () => {
    if (!user) {
      toast.error("Please login first to join");
      router.push("/login");
      return;
    }
    if (isMember) {
      if (!hasMonthAssigned) {
        setShowMonthModal(true);
      } else {
        router.push(`/group/${group.id}`);
      }
      return;
    }
    setShowTrustModal(true);
  };

  const confirmTrust = () => {
    setShowTrustModal(false);
    setShowMonthModal(true);
  };

  const toggleMonthSelection = (m: number) => {
    if (selectedMonths.includes(m)) {
      setSelectedMonths(selectedMonths.filter(x => x !== m));
    } else {
      setSelectedMonths([...selectedMonths, m]);
    }
  };

  const confirmJoin = async () => {
    if (selectedMonths.length === 0) {
      toast.error("Please select at least one month");
      return;
    }

    setJoining(true);
    try {
      if (!isMember) {
        // Final race condition membership check
        const memberQuery = query(
          collection(db, `groups/${group.id}/members`),
          where("userId", "==", user!.uid)
        );
        const memberSnap = await getDocs(memberQuery);
        if (!memberSnap.empty && hasMonthAssigned) {
          toast.error("You are already a member of this group");
          router.push(`/group/${group.id}`);
          return;
        }

        if (memberSnap.empty) {
          // Add membership
          await addDoc(collection(db, `groups/${group.id}/members`), {
            userId: user!.uid,
            joinedAt: serverTimestamp(),
            paymentStatus: "pending"
          });
        }
      }

      // Save month selection
      for (const m of selectedMonths) {
        await addDoc(collection(db, `groups/${group.id}/payoutMonths`), {
          month: m,
          userId: user!.uid,
          userName: user!.displayName || "User",
          userEmail: user!.email || "",
          amount: group.amount,
          assignedAt: serverTimestamp()
        });
      }

      toast.success(isMember ? "Successfully selected month(s)!" : "Successfully joined the group!");
      router.push(`/group/${group.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to join group");
    } finally {
      setJoining(false);
      setShowMonthModal(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading group details...</div>;
  if (!group) return <div className="p-8 text-center text-red-500">Invalid invite link</div>;

  const expectedPayout = calculateExpectedPayout(
    group.amount,
    group.totalMembers,
    group.payoutChargeType || "none",
    group.payoutChargeValue || 0
  );

  return (
    <div className="container mx-auto py-10 max-w-xl px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">{group.name}</CardTitle>
          <CardDescription>You've been invited to join this Osusu group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg border">
              <p className="text-xs text-muted-foreground">Contribution</p>
              <p className="text-lg font-bold">
                {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(group.amount)}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg border">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="text-lg font-bold">{group.duration} Months</p>
            </div>
          </div>
          <div className="p-4 bg-muted rounded-lg border">
            <p className="text-xs text-muted-foreground">Expected Payout</p>
            <p className="text-xl font-bold text-primary">
              {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(expectedPayout)}
            </p>
          </div>
          <div className="flex justify-between items-center p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-950/20 dark:border-orange-900">
            <span className="font-medium text-orange-850 text-sm">Admin Payout Charge</span>
            {group.payoutChargeType === "none" ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">No Fee</Badge>
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
            {isMember ? "View Activities" : "Join Group Now"}
          </Button>
        </CardFooter>
      </Card>

      {/* Trust Warning Modal */}
      {showTrustModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-xl max-w-md w-full space-y-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-destructive">Wait! Read This</h2>
            <p className="text-lg">
              You will pay money <strong>directly</strong> to the admin's bank account. This app does <strong>NOT</strong> hold funds.
            </p>
            <p className="text-muted-foreground">
              Do you trust this person? By continuing, you acknowledge the risk.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="w-full" onClick={() => setShowTrustModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" className="w-full" onClick={confirmTrust}>
                I Understand & Join
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Month Selection Modal */}
      {showMonthModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background p-6 rounded-xl max-w-md w-full space-y-6 max-h-[90vh] overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold">Select Payout Month(s)</h2>
              <p className="text-xs text-muted-foreground mt-1">Choose which month(s) you wish to receive the payout.</p>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
              {Array.from({ length: group.duration }).map((_, idx) => {
                const monthNum = idx + 1;
                const isOccupied = occupiedMonths.includes(monthNum);
                const isSelected = selectedMonths.includes(monthNum);

                return (
                  <button
                    key={monthNum}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => toggleMonthSelection(monthNum)}
                    className={`
                      p-3 rounded-lg border text-sm font-semibold transition-all
                      ${isOccupied ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50" : ""}
                      ${isSelected && !isOccupied ? "bg-primary border-primary text-white" : ""}
                      ${!isSelected && !isOccupied ? "bg-card border-border hover:border-primary/50 text-foreground" : ""}
                    `}
                  >
                    Month {monthNum}
                  </button>
                );
              })}
            </div>

            {selectedMonths.length > 0 && (
              <div className="p-3.5 bg-muted rounded-lg space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Contribution:</span>
                  <span className="font-semibold">
                    ₦{Number(group.amount).toLocaleString()} × {selectedMonths.length} Month{selectedMonths.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border/60 pt-1.5 text-base font-bold">
                  <span>Total Monthly Payment:</span>
                  <span className="text-primary">₦{(group.amount * selectedMonths.length).toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="w-full" onClick={() => setShowMonthModal(false)}>
                Cancel
              </Button>
              <Button className="w-full bg-primary hover:bg-primary/95 text-white" onClick={confirmJoin} disabled={joining || selectedMonths.length === 0}>
                {joining ? "Joining..." : "Join Group Now"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
