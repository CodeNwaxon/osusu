"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Users, PlusCircle, ArrowRight, Crown, UserPlus, LayoutDashboard, Calendar, Banknote, Edit, Save } from "lucide-react";
import { toast } from "sonner";

interface GroupData {
  id: string;
  name: string;
  amount: number;
  duration: number;
  totalMembers: number;
  payoutDay: number;
  payoutChargeType: string;
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
  
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchGroups = async () => {
      try {
        // Fetch groups created by this user
        const createdQuery = query(
          collection(db, "groups"),
          where("creatorId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const createdSnap = await getDocs(createdQuery);
        const created: GroupData[] = [];
        createdSnap.forEach((doc) => {
          created.push({ id: doc.id, ...doc.data() } as GroupData);
        });
        setCreatedGroups(created);

        // Fetch groups this user has joined (via members subcollection)
        // We need to query all groups and check membership
        const allGroupsSnap = await getDocs(collection(db, "groups"));
        const joined: GroupData[] = [];

        for (const groupDoc of allGroupsSnap.docs) {
          // Skip groups the user created (they're already in the created list)
          if (groupDoc.data().creatorId === user.uid) continue;

          const membersQuery = query(
            collection(db, `groups/${groupDoc.id}/members`),
            where("userId", "==", user.uid)
          );
          const membersSnap = await getDocs(membersQuery);
          if (!membersSnap.empty) {
            joined.push({ id: groupDoc.id, ...groupDoc.data() } as GroupData);
          }
        }
        setJoinedGroups(joined);

        // Fetch User Profile
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileName(userData.name || user.displayName || "");
          setProfilePhone(userData.phone || "");
        } else {
          setProfileName(user.displayName || "");
        }

      } catch (error) {
        console.error("Error fetching dashboard groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: profileName,
        phone: profilePhone,
      });
      toast.success("Profile updated successfully");
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

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
        {/* Profile Section */}
        <section>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Profile</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true)}
                  disabled={savingProfile}
                >
                  {isEditingProfile ? (
                    <><Save className="w-4 h-4 mr-2" /> {savingProfile ? "Saving..." : "Save"}</>
                  ) : (
                    <><Edit className="w-4 h-4 mr-2" /> Edit Profile</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)} 
                    disabled={!isEditingProfile} 
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    value={profilePhone} 
                    onChange={(e) => setProfilePhone(e.target.value)} 
                    disabled={!isEditingProfile} 
                    placeholder="e.g. 08012345678"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

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
          <span className="font-bold text-base text-primary">
            {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(group.amount)}
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
