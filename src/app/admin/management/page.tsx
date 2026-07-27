"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Shield, Trash2, Check, X, UserPlus, Loader2, Pencil, Lock, Eye, EyeOff } from "lucide-react";

interface AdminRecord {
  uid: string;
  email: string;
  routes: string[];
}

interface UserRecord {
  uid: string;
  email: string;
  name: string;
}

const AVAILABLE_ROUTES = [
  "/admin/statistics",
  "/admin/settings",
  "/admin/complaints",
  "/admin/broadcast",
  "/admin/faq",
  "/admin/terms",
  "/admin/about"
];

export default function AdminManagementPage() {
  const { isCEO } = useAdmin();
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<UserRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<AdminRecord | null>(null);
  const [editTarget, setEditTarget] = useState<AdminRecord | null>(null);
  const [editRoutes, setEditRoutes] = useState<string[]>([]);

  // CEO Password state
  const [ceoPassword, setCeoPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    console.log("AdminManagementPage mounted, isCEO:", isCEO);
  }, [isCEO]);

  useEffect(() => {
    if (!isCEO) {
      console.log("Not CEO, skipping data fetch");
      return;
    }
    console.log("CEO detected, fetching data...");
    fetchAdmins();
    fetchAllUsers();
    fetchCeoPassword();
  }, [isCEO]);

  const fetchAdmins = async () => {
    console.log("fetchAdmins called");
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "admins"));
      console.log("Admins snapshot size:", snapshot.size);
      const adminList: AdminRecord[] = [];
      snapshot.forEach(doc => {
        adminList.push({ uid: doc.id, ...doc.data() } as AdminRecord);
      });
      console.log("Admins list:", adminList);
      setAdmins(adminList);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    console.log("fetchAllUsers called");
    try {
      const snapshot = await getDocs(collection(db, "users"));
      console.log("Users snapshot size:", snapshot.size);
      const userList: UserRecord[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log("User doc:", doc.id, data);
        userList.push({
          uid: doc.id,
          email: data.email || "",
          name: data.name || "No name"
        });
      });
      console.log("Final user list:", userList);
      setAllUsers(userList);
      setUsersLoaded(true);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users list");
      setUsersLoaded(true);
    }
  };

  const fetchCeoPassword = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, "settings", "global"));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setCeoPassword(data.ceoPassword || "prince2020");
      } else {
        setCeoPassword("prince2020");
      }
    } catch (error) {
      console.error("Error fetching CEO password:", error);
      setCeoPassword("prince2020");
    }
  };

  const handleSaveCeoPassword = async () => {
    if (!ceoPassword.trim()) {
      toast.error("Password cannot be empty");
      return;
    }
    setSavingPassword(true);
    try {
      await updateDoc(doc(db, "settings", "global"), { ceoPassword: ceoPassword.trim() });
      toast.success("CEO password updated successfully");
    } catch (error) {
      console.error("Error saving CEO password:", error);
      toast.error("Failed to save CEO password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSearchChange = useCallback((value: string) => {
    console.log("Search input changed:", value);
    console.log("All users available:", allUsers.length);

    setSearchEmail(value);
    setSelectedUser(null);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    const query = value.toLowerCase();
    const filtered = allUsers.filter(u =>
      u.email?.toLowerCase().includes(query) ||
      u.name?.toLowerCase().includes(query)
    );
    console.log("Filtered results:", filtered);
    setSearchResults(filtered);
  }, [allUsers]);

  const selectUser = (user: UserRecord) => {
    console.log("User selected:", user);
    setSelectedUser(user);
    setSearchEmail(user.email);
    setSearchResults([]);
    setSelectedRoutes([...AVAILABLE_ROUTES]);
  };

  const toggleRoute = (route: string) => {
    if (selectedRoutes.includes(route)) {
      setSelectedRoutes(selectedRoutes.filter(r => r !== route));
    } else {
      setSelectedRoutes([...selectedRoutes, route]);
    }
  };

  const handleMakeAdmin = async () => {
    if (!selectedUser) return;
    try {
      await setDoc(doc(db, "admins", selectedUser.uid), {
        email: selectedUser.email,
        routes: selectedRoutes,
        createdAt: new Date().toISOString()
      });
      toast.success(`${selectedUser.email} is now an admin`);
      setSelectedUser(null);
      setSearchEmail("");
      setSearchResults([]);
      fetchAdmins();
    } catch (error) {
      console.error("Error making admin:", error);
      toast.error("Failed to make admin");
    }
  };

  const handleEditClick = (admin: AdminRecord) => {
    setEditTarget(admin);
    setEditRoutes(admin.routes || []);
  };

  const toggleEditRoute = (route: string) => {
    if (editRoutes.includes(route)) {
      setEditRoutes(editRoutes.filter(r => r !== route));
    } else {
      setEditRoutes([...editRoutes, route]);
    }
  };

  const handleUpdateAdmin = async () => {
    if (!editTarget) return;
    try {
      await setDoc(doc(db, "admins", editTarget.uid), {
        email: editTarget.email,
        routes: editRoutes,
      }, { merge: true });
      toast.success("Admin routes updated successfully");
      setEditTarget(null);
      fetchAdmins();
    } catch (error) {
      console.error("Error updating admin:", error);
      toast.error("Failed to update admin routes");
    }
  };

  const handleDeleteAdmin = async (uid: string) => {
    try {
      await deleteDoc(doc(db, "admins", uid));
      toast.success("Admin removed successfully");
      setDeleteTarget(null);
      fetchAdmins();
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast.error("Failed to delete admin");
    }
  };

  if (isCEO === false) {
    return <div className="p-10 text-center text-muted-foreground">Access denied. CEO only.</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-8 relative">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Admin Management
        </h1>
        <p className="text-muted-foreground mt-1">Assign and manage sub-admin roles and routes.</p>
        <p className="text-xs text-muted-foreground mt-2">
          Users loaded: {allUsers.length} | Users loaded state: {usersLoaded ? "✅" : "❌"}
        </p>
      </div>

      {/* FIX: Added overflow-visible */}
      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Add New Admin</CardTitle>
          <CardDescription>Start typing a user&apos;s email to search registered users.</CardDescription>
        </CardHeader>
        {/* FIX: Added overflow-visible to CardContent too */}
        <CardContent className="overflow-visible">
          <div className="relative">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchEmail}
                  onChange={e => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              {!usersLoaded && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading users...
                </div>
              )}
              {usersLoaded && allUsers.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  ⚠️ No users found in database
                </div>
              )}
            </div>

            {/* Live search dropdown */}
            {searchResults.length > 0 && !selectedUser && (
              <div className="absolute left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-900 border border-border rounded-lg shadow-2xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  {searchResults.map(user => (
                    <button
                      key={user.uid}
                      onClick={() => selectUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-left transition-colors border-b last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                        {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{user.name || "No name"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <UserPlus className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No results message */}
            {searchEmail.trim() && searchResults.length === 0 && !selectedUser && usersLoaded && (
              <p className="text-sm text-muted-foreground mt-2">No registered users found matching &ldquo;{searchEmail}&rdquo;</p>
            )}
          </div>

          {/* Selected user — route assignment */}
          {selectedUser && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/20">
              <div className="font-medium text-lg">{selectedUser.name} <span className="text-sm text-muted-foreground font-normal">({selectedUser.email})</span></div>

              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Assign Routes:</p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ROUTES.map(route => (
                    <Badge
                      key={route}
                      variant={selectedRoutes.includes(route) ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1 text-xs"
                      onClick={() => toggleRoute(route)}
                    >
                      {selectedRoutes.includes(route) && <Check className="w-3 h-3 mr-1 inline" />}
                      {route}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setSelectedUser(null); setSearchEmail(""); setSearchResults([]); }}>Cancel</Button>
                <Button onClick={handleMakeAdmin}>Make Admin</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Admins</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => <div key={i} className="h-10 bg-muted rounded"></div>)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Authorized Routes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map(admin => (
                  <TableRow key={admin.uid}>
                    <TableCell className="font-medium">{admin.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {admin.routes?.map(r => (
                          <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={() => handleEditClick(admin)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteTarget(admin)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {admins.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-6">No sub-admins found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <X className="w-5 h-5" /> Remove Admin
              </CardTitle>
              <CardDescription>
                Are you sure you want to revoke admin privileges for <strong className="text-foreground">{deleteTarget.email}</strong>? They will immediately lose access to the admin panel.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDeleteAdmin(deleteTarget.uid)}>Yes, Remove Admin</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" /> Edit Admin Routes
              </CardTitle>
              <CardDescription>
                Update access routes for <strong className="text-foreground">{editTarget.email}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mt-2">
                <p className="text-sm font-medium mb-2">Assign Routes:</p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ROUTES.map(route => (
                    <Badge
                      key={route}
                      variant={editRoutes.includes(route) ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1 text-xs"
                      onClick={() => toggleEditRoute(route)}
                    >
                      {editRoutes.includes(route) && <Check className="w-3 h-3 mr-1 inline" />}
                      {route}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button onClick={handleUpdateAdmin}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CEO Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" /> CEO Password
          </CardTitle>
          <CardDescription>This password is required when admins send broadcast messages. Default: prince2020</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md">
            <div className="relative flex-1">
              <Input
                type={showPassword ? "text" : "password"}
                value={ceoPassword}
                onChange={(e) => setCeoPassword(e.target.value)}
                placeholder="Enter CEO password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button onClick={handleSaveCeoPassword} disabled={savingPassword}>
              {savingPassword ? "Saving..." : "Save Password"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}