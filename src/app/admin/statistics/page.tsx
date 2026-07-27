"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Settings, Shield, Search, MessageSquare } from "lucide-react";

interface UserData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  rating: number;
  trustScore: number;
  completedGroups: number;
  createdAt: any;
}

interface GlobalSettings {
  maxFixedCharge: number;
  maxPercentageCharge: number;
}

export default function StatisticsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const { isCEO, adminRoutes } = useAdmin();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalReviews, setTotalReviews] = useState(0);

  // Settings state
  const [settings, setSettings] = useState<GlobalSettings>({
    maxFixedCharge: 500,
    maxPercentageCharge: 0.5,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const fetchedUsers: UserData[] = [];
        querySnapshot.forEach((docSnap) => {
          fetchedUsers.push({ uid: docSnap.id, ...docSnap.data() } as UserData);
        });
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "global"));
        if (settingsDoc.exists()) {
          setSettings(settingsDoc.data() as GlobalSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    const fetchReviewsCount = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "reviews"));
        setTotalReviews(querySnapshot.size);
      } catch (error) {
        console.error("Error fetching reviews count:", error);
      }
    };

    fetchUsers();
    fetchSettings();
    fetchReviewsCount();
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "global"), settings);
      toast.success("Settings saved successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="container mx-auto py-10 px-4 md:px-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage platform settings and users.</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Users</p>
                <p className="text-3xl font-bold text-foreground mt-1">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Reviews</p>
                <p className="text-3xl font-bold text-foreground mt-1">{totalReviews}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Max Fixed Charge</p>
                <p className="text-3xl font-bold text-foreground mt-1">₦{settings.maxFixedCharge}</p>
              </div>
              <Settings className="h-8 w-8 text-orange-400/40" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Max % Charge</p>
                <p className="text-3xl font-bold text-foreground mt-1">{settings.maxPercentageCharge}%</p>
              </div>
              <Settings className="h-8 w-8 text-green-400/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Settings */}
      <Card className="border-border/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Global Platform Settings
          </CardTitle>
          <CardDescription>
            Configure charge limits for all groups on the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxFixed">Max Fixed Charge (₦)</Label>
              <Input
                id="maxFixed"
                type="number"
                value={settings.maxFixedCharge}
                onChange={(e) =>
                  setSettings({ ...settings, maxFixedCharge: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum fixed payout charge an admin can set.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPct">Max Percentage Charge (%)</Label>
              <Input
                id="maxPct"
                type="number"
                step="0.01"
                value={settings.maxPercentageCharge}
                onChange={(e) =>
                  setSettings({ ...settings, maxPercentageCharge: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum percentage payout charge an admin can set.
              </p>
            </div>
          </div>
          <Button
            className="mt-6 rounded-full px-8"
            onClick={handleSaveSettings}
            disabled={savingSettings}
          >
            {savingSettings ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Registered Users */}
      <Card className="border-border/30">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Registered Users
              </CardTitle>
              <CardDescription>
                {users.length} total registered users
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10 rounded-full bg-muted/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Rating</TableHead>
                    <TableHead className="hidden lg:table-cell">Trust Score</TableHead>
                    <TableHead className="hidden lg:table-cell">Groups</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.uid}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{u.email}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs">{u.phone || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          ⭐ {u.rating?.toFixed(1) || "5.0"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{u.trustScore ?? 100}</TableCell>
                      <TableCell className="hidden lg:table-cell">{u.completedGroups ?? 0}</TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
