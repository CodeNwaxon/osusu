"use client";

import { useAdmin } from "@/hooks/useAdmin";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, Users, Settings, Phone, FileText, HelpCircle } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isCEO, adminRoutes, loadingAdmin } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

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
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname.startsWith("/admin/complaints") ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Phone className="w-4 h-4" /> Complaints
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
