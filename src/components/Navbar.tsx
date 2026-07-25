"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/store/useAuth";
import { Button, buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Logged out successfully");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center">
            <img src="/osusu_logo2.png" alt="site logo" className="h-9 w-9 rounded-full object-cover" />
          </div>
          <span className="text-sm md:text-xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
            Osusu 9ja
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link>
          <Link href="/create-group" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Create Group
          </Link>
          <ThemeToggle />
          {user ? (
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img src={user.photoURL} alt="Profile" className="h-8 w-8 rounded-full ring-2 ring-primary/20" />
              )}
              <span className="text-sm font-medium hidden lg:inline">{user.displayName}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ size: "sm", className: "rounded-full px-6" })}
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background p-4 space-y-3 animate-in slide-in-from-top-2">
          <Link href="/" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Home</Link>
          <Link href="/create-group" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Create Group</Link>
          {user ? (
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="flex items-center gap-2">
                {user.photoURL && <img src={user.photoURL} alt="Profile" className="h-8 w-8 rounded-full" />}
                <span className="text-sm">{user.displayName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
            </div>
          ) : (
            <Link
              href="/login"
              className={buttonVariants({ className: "w-full rounded-full" })}
              onClick={() => setMobileOpen(false)}
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
