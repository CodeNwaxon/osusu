"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Shield, Trash2, Check, X, UserPlus, Loader2 } from "lucide-react";

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
  "/admin/settings",
  "/admin/complaints",
  "/admin/faq",
  "/admin/terms",
  "/admin/about"
];

export default function AdminManagementPage() {
  const { isCEO } = useAdmin();
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // All users cache (fetched once)
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // Search state
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<UserRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  
  // Confirm Delete State
  const [deleteTarget, setDeleteTarget] = useState<AdminRecord | null>(null);

  useEffect(() => {
    if (!isCEO) return;
    fetchAdmins();
    fetchAllUsers();
  }, [isCEO]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "admins"));
      const adminList: AdminRecord[] = [];
      snapshot.forEach(doc => {
        adminList.push({ uid: doc.id, ...doc.data() } as AdminRecord);
      });
      setAdmins(adminList);
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const userList: UserRecord[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        userList.push({ uid: doc.id, email: data.email || "", name: data.name || "" });
      });
      setAllUsers(userList);
      setUsersLoaded(true);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users list");
    }
  };

  // Live search: filter users as the CEO types
  const handleSearchChange = useCallback((value: string) => {
    setSearchEmail(value);
    setSelectedUser(null);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    const query = value.toLowerCase();
    const filtered = allUsers.filter(u => 
      u.email.toLowerCase().includes(query) || 
      u.name.toLowerCase().includes(query)
    );
    setSearchResults(filtered);
  }, [allUsers]);

  const selectUser = (user: UserRecord) => {
    setSelectedUser(user);
    setSearchEmail(user.email);
    setSearchResults([]);
    // Pre-select all routes by default
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

  if (!isCEO) {
    return <div className="p-10 text-center text-muted-foreground">Access denied. CEO only.</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-8 relative">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" /> Admin Management
        </h1>
        <p className="text-muted-foreground mt-1">Assign and manage sub-admin roles and routes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Admin</CardTitle>
          <CardDescription>Start typing a user&apos;s email to search registered users.</CardDescription>
        </CardHeader>
        <CardContent>
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
            </div>

            {/* Live search dropdown */}
            {searchResults.length > 0 && !selectedUser && (
              <div className="absolute z-20 mt-1 w-full max-w-md bg-popover border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="max-h-60 overflow-y-auto">
                  {searchResults.map(user => (
                    <button
                      key={user.uid}
                      onClick={() => selectUser(user)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent text-left transition-colors border-b last:border-b-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                        {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
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
            <div className="mt-6 p-4 border rounded-lg bg-muted/20 animate-in fade-in">
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
                <Button variant="outline" onClick={() => { setSelectedUser(null); setSearchEmail(""); }}>Cancel</Button>
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
                    <TableCell className="text-right">
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

      {/* Custom Confirm Card for Deletion */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-lg animate-in zoom-in-95">
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
    </div>
  );
}
