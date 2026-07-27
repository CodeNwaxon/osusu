"use client";

import { useAdmin } from "@/hooks/useAdmin";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LayoutDashboard, Users, Settings, Phone, FileText, HelpCircle, BarChart3, Megaphone } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isCEO, adminRoutes, loadingAdmin } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadComplaints, setUnreadComplaints] = useState(0);

  useEffect(() => {
    if (loadingAdmin) return;

    if (!isAdmin) {
      router.push("/");
      return;
    }

    // Check route permissions if not CEO
    if (!isCEO) {
      const allowed = adminRoutes.some(r => pathname.startsWith(r));
      // /admin is allowed if they have any admin access
      if (pathname !== "/admin" && !allowed && !adminRoutes.includes("*")) {
        router.push("/admin");
      }
    }
  }, [isAdmin, isCEO, adminRoutes, loadingAdmin, pathname, router]);

  useEffect(() => {
    if (!isAdmin) return;

    // Subscribe to complaints to count unread
    const q = query(collection(db, "complaints"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let unreadCount = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.readByAdmin) {
          unreadCount++;
        }
      });
      setUnreadComplaints(unreadCount);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  if (loadingAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Checking admin access...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="hidden md:block w-64 border-r border-border bg-muted/20 p-4 space-y-2 shrink-0">
        <div className="pb-4 mb-4 border-b border-border">
          <h2 className="text-lg font-bold">Admin Portal</h2>
          <p className="text-xs text-muted-foreground">Manage Osusu 9ja</p>
        </div>

        <nav className="space-y-1">
          <Link
            href="/admin"
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === "/admin" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>

          {(isCEO || adminRoutes.includes("/admin/statistics") || adminRoutes.includes("*")) && (
            <Link
              href="/admin/statistics"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname.startsWith("/admin/statistics") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <BarChart3 className="w-4 h-4" /> Platform Statistics
            </Link>
          )}

          {(isCEO || adminRoutes.includes("/admin/management") || adminRoutes.includes("*")) && (
            <Link
              href="/admin/management"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname.startsWith("/admin/management") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Users className="w-4 h-4" /> Admin Management
            </Link>
          )}

          {(isCEO || adminRoutes.includes("/admin/settings") || adminRoutes.includes("*")) && (
            <Link
              href="/admin/settings"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname.startsWith("/admin/settings") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Settings className="w-4 h-4" /> Settings CMS
            </Link>
          )}

          {(isCEO || adminRoutes.includes("/admin/complaints") || adminRoutes.includes("*")) && (
            <Link
              href="/admin/complaints"
              className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname.startsWith("/admin/complaints") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" /> Complaints
              </div>
              {unreadComplaints > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                  {unreadComplaints}
                </span>
              )}
            </Link>
          )}

          {(isCEO || adminRoutes.includes("/admin/broadcast") || adminRoutes.includes("*")) && (
            <Link
              href="/admin/broadcast"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname.startsWith("/admin/broadcast") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Megaphone className="w-4 h-4" /> Broadcast
            </Link>
          )}

          {(isCEO || adminRoutes.includes("/admin/faq") || adminRoutes.includes("*")) && (
            <Link
              href="/admin/faq"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname.startsWith("/admin/faq") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <HelpCircle className="w-4 h-4" /> Manage FAQ
            </Link>
          )}

          {(isCEO || adminRoutes.includes("/admin/terms") || adminRoutes.includes("*")) && (
            <Link
              href="/admin/terms"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname.startsWith("/admin/terms") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <FileText className="w-4 h-4" /> Terms & Conditions
            </Link>
          )}

          {(isCEO || adminRoutes.includes("/admin/about") || adminRoutes.includes("*")) && (
            <Link
              href="/admin/about"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname.startsWith("/admin/about") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <FileText className="w-4 h-4" /> About & CEO
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
