"use client";

import { useAdmin } from "@/hooks/useAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Settings, Phone, FileText, HelpCircle, Shield, BarChart3, ArrowRight, Megaphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminDashboardPage() {
  const { isCEO, adminRoutes, isAdmin, loadingAdmin } = useAdmin();

  if (loadingAdmin || !isAdmin) {
    return (
      <div className="container mx-auto py-20 px-4 flex justify-center">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const routes = [
    {
      href: "/admin/statistics",
      title: "Platform Statistics",
      description: "View global settings and user statistics.",
      icon: <BarChart3 className="w-8 h-8 text-primary" />,
      allowed: isCEO || adminRoutes.includes("/admin/statistics") || adminRoutes.includes("*")
    },
    {
      href: "/admin/management",
      title: "Admin Management",
      description: "Assign sub-admins and manage their permissions.",
      icon: <Users className="w-8 h-8 text-orange-500" />,
      allowed: isCEO || adminRoutes.includes("/admin/management") || adminRoutes.includes("*")
    },
    {
      href: "/admin/settings",
      title: "Settings CMS",
      description: "Configure app-wide text, links, and content.",
      icon: <Settings className="w-8 h-8 text-blue-500" />,
      allowed: isCEO || adminRoutes.includes("/admin/settings") || adminRoutes.includes("*")
    },
    {
      href: "/admin/complaints",
      title: "Complaints",
      description: "View and resolve user issues and messages.",
      icon: <Phone className="w-8 h-8 text-red-500" />,
      allowed: isCEO || adminRoutes.includes("/admin/complaints") || adminRoutes.includes("*")
    },
    {
      href: "/admin/faq",
      title: "Manage FAQ",
      description: "Update the Frequently Asked Questions page.",
      icon: <HelpCircle className="w-8 h-8 text-green-500" />,
      allowed: isCEO || adminRoutes.includes("/admin/faq") || adminRoutes.includes("*")
    },
    {
      href: "/admin/terms",
      title: "Terms & Conditions",
      description: "Edit the platform's Terms of Service.",
      icon: <FileText className="w-8 h-8 text-purple-500" />,
      allowed: isCEO || adminRoutes.includes("/admin/terms") || adminRoutes.includes("*")
    },
    {
      href: "/admin/broadcast",
      title: "Broadcasts",
      description: "Send and manage platform-wide notifications.",
      icon: <Megaphone className="w-8 h-8 text-yellow-500" />,
      allowed: isCEO || adminRoutes.includes("/admin/broadcast") || adminRoutes.includes("*")
    },
    {
      href: "/admin/about",
      title: "About & CEO",
      description: "Manage About Us and CEO public profile details.",
      icon: <FileText className="w-8 h-8 text-cyan-500" />,
      allowed: isCEO || adminRoutes.includes("/admin/about") || adminRoutes.includes("*")
    }
  ];

  const allowedRoutes = routes.filter(r => r.allowed);

  return (
    <div className="container mx-auto py-10 px-4 md:px-6 space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {isCEO ? "CEO Dashboard" : "Admin Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome to the Osusu 9ja management portal. Select a module below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {allowedRoutes.map((route) => (
          <Link href={route.href} key={route.href}>
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group bg-muted/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-2">
                  {route.icon}
                  <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{route.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {route.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {allowedRoutes.length === 0 && (
        <Card className="bg-muted/30 border-dashed">
          <CardContent className="py-12 flex flex-col items-center text-center">
            <Shield className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No Access Assigned</h3>
            <p className="text-muted-foreground text-sm max-w-md mt-2">
              You do not have permission to view any admin modules yet. Please contact the CEO to request access routes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
