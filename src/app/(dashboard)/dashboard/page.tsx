"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, orderBy, collectionGroup, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Users, PlusCircle, ArrowRight, Crown, UserPlus, LayoutDashboard, Calendar, Banknote } from "lucide-react";
import { calculateExpectedPayout, PayoutChargeType } from "@/lib/calculations";

interface GroupData {
  id: string;
  name: string;
  amount: number;
  duration: number;
  totalMembers: number;
  payoutDay: number;
  payoutChargeType: PayoutChargeType;
  payoutChargeValue: number;
  creatorId: string;
  refCode: string;
  status: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [createdGroups, setCreatedGroups] = useState<GroupData[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    // Listen to groups created by this user
    const createdQuery = query(
      collection(db, "groups"),
      where("creatorId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsubCreated = onSnapshot(createdQuery, (createdSnap) => {
      const created: GroupData[] = [];
      createdSnap.forEach((doc) => {
        created.push({ id: doc.id, ...doc.data() } as GroupData);
      });
      setCreatedGroups(created);
      setLoading(false);
    }, (error) => {
      console.error("Error watching created groups:", error);
    });

    // Listen to all groups and check membership in real-time
    const allGroupsQuery = collection(db, "groups");
    const unsubJoined = onSnapshot(allGroupsQuery, async (allGroupsSnap) => {
      const joined: GroupData[] = [];
      
      // We will perform a snapshot listen for members on each group to ensure real-time update
      for (const groupDoc of allGroupsSnap.docs) {
        const data = groupDoc.data();
        if (data.creatorId === user.uid) continue;

        // Since it's nested snapshot, we can get active members list
        const membersSnap = await getDocs(query(
          collection(db, `groups/${groupDoc.id}/members`),
          where("userId", "==", user.uid)
        ));
        if (!membersSnap.empty) {
          joined.push({ id: groupDoc.id, ...data } as GroupData);
        }
      }
      setJoinedGroups(joined);
    }, (error) => {
      console.error("Error watching joined groups:", error);
    });

    return () => {
      unsubCreated();
      unsubJoined();
    };
  }, [user]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-lg">Loading...</div>
      </div>
    );
  }

  const totalGroups = createdGroups.length + joinedGroups.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <div className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-orange-500/5 to-transparent" />
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/20">
                <LayoutDashboard className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  Welcome back, {user?.displayName?.split(" ")[0] || "User"}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {totalGroups === 0
                    ? "You haven't joined or created any groups yet."
                    : `You have ${totalGroups} group${totalGroups !== 1 ? "s" : ""} active.`}
                </p>
              </div>
            </div>
            <Link
              href="/create-group"
              className={buttonVariants({
                className: "rounded-full px-6 bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white shadow-lg shadow-primary/20",
              })}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Group
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{createdGroups.length}</p>
                <p className="text-xs text-muted-foreground">Created</p>
              </div>
            </div>
            <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{joinedGroups.length}</p>
                <p className="text-xs text-muted-foreground">Joined</p>
              </div>
            </div>
            <div className="hidden md:flex bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl p-4 items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalGroups}</p>
                <p className="text-xs text-muted-foreground">Total Groups</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 space-y-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-52 bg-muted border-border/30" />
            ))}
          </div>
        ) : (
          <>
            {/* Groups You Created */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Crown className="h-5 w-5 text-primary" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Groups You Created</h2>
                <Badge variant="secondary" className="ml-2">{createdGroups.length}</Badge>
              </div>

              {createdGroups.length === 0 ? (
                <Card className="border-dashed border-border/60 bg-muted/20">
                  <CardContent className="py-12 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <PlusCircle className="h-8 w-8 text-primary/50" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No groups created yet</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                      Start your own Osusu group and invite trusted members to contribute together.
                    </p>
                    <Link
                      href="/create-group"
                      className={buttonVariants({ variant: "outline", className: "mt-6 rounded-full" })}
                    >
                      Create Your First Group
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {createdGroups.map((group) => (
                    <GroupCard key={group.id} group={group} role="creator" />
                  ))}
                </div>
              )}
            </section>

            {/* Groups You Joined */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <UserPlus className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Groups You Joined</h2>
                <Badge variant="secondary" className="ml-2">{joinedGroups.length}</Badge>
              </div>

              {joinedGroups.length === 0 ? (
                <Card className="border-dashed border-border/60 bg-muted/20">
                  <CardContent className="py-12 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-green-500/50" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">No groups joined yet</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                      Browse available groups on the home page and join one that fits your budget.
                    </p>
                    <Link
                      href="/"
                      className={buttonVariants({ variant: "outline", className: "mt-6 rounded-full" })}
                    >
                      Discover Groups
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {joinedGroups.map((group) => (
                    <GroupCard key={group.id} group={group} role="member" />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function GroupCard({ group, role }: { group: GroupData; role: "creator" | "member" }) {
  return (
    <Card className="overflow-hidden border-border/30 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group/card">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
          <Badge
            className={
              role === "creator"
                ? "bg-primary/10 text-primary hover:bg-primary/10 whitespace-nowrap text-[10px]"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 whitespace-nowrap text-[10px]"
            }
          >
            {role === "creator" ? (
              <><Crown className="h-3 w-3 mr-1" /> Creator</>
            ) : (
              <><UserPlus className="h-3 w-3 mr-1" /> Member</>
            )}
          </Badge>
        </div>
        <CardDescription className="text-muted-foreground text-xs">
          {group.duration} Months · Payout on {group.payoutDay}th
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Banknote className="h-3.5 w-3.5" /> Contribution
          </span>
          <span className="font-bold text-sm text-foreground">
            {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(group.amount)}
          </span>
        </div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Banknote className="h-3.5 w-3.5" /> Expected Payout
          </span>
          <span className="font-bold text-base text-primary">
            {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
              calculateExpectedPayout(group.amount, group.totalMembers, group.payoutChargeType || "none", group.payoutChargeValue || 0)
            )}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Members
          </span>
          <span className="text-sm font-medium">/ {group.totalMembers}</span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Link
          href={`/group/${group.id}`}
          className={buttonVariants({
            variant: "outline",
            className: "w-full rounded-full group-hover/card:border-primary/50 group-hover/card:text-primary transition-colors",
          })}
        >
          Open Group
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
}
