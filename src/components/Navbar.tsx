"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/store/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button, buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { toast } from "sonner";
import { LogOut, Menu, X, Home, PlusCircle, HelpCircle, Shield, Phone, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Logged out successfully");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setHelpOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <div className="hidden md:flex items-center md:gap-8 gap-4">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Home className="w-4 h-4" /> Home
          </Link>
          <Link href="/create-group" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <PlusCircle className="w-4 h-4" /> Create Group
          </Link>

          <div className="relative" ref={helpRef}>
            <button
              onClick={() => setHelpOpen(!helpOpen)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" /> Help
            </button>
            {helpOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-background border border-border rounded-md shadow-md py-1 animate-in fade-in zoom-in-95">
                <Link href="/faq" onClick={() => setHelpOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors">
                  <FileText className="w-4 h-4" /> FAQ
                </Link>
                <Link href="/about" onClick={() => setHelpOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors">
                  <FileText className="w-4 h-4" /> About Us
                </Link>
                <Link href="/contact" onClick={() => setHelpOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors">
                  <Phone className="w-4 h-4" /> Contact Us
                </Link>
              </div>
            )}
          </div>

          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-500 transition-colors bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
              <Shield className="w-4 h-4" /> CEO Panel
            </Link>
          )}

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
          <Link href="/" className="flex items-center gap-2 text-sm font-medium py-2" onClick={() => setMobileOpen(false)}><Home className="w-4 h-4" /> Home</Link>
          <Link href="/create-group" className="flex items-center gap-2 text-sm font-medium py-2" onClick={() => setMobileOpen(false)}><PlusCircle className="w-4 h-4" /> Create Group</Link>
          <Link href="/faq" className="flex items-center gap-2 text-sm font-medium py-2" onClick={() => setMobileOpen(false)}><FileText className="w-4 h-4" /> FAQ</Link>
          <Link href="/about" className="flex items-center gap-2 text-sm font-medium py-2" onClick={() => setMobileOpen(false)}><FileText className="w-4 h-4" /> About Us</Link>
          <Link href="/contact" className="flex items-center gap-2 text-sm font-medium py-2" onClick={() => setMobileOpen(false)}><Phone className="w-4 h-4" /> Contact Us</Link>

          {isAdmin && (
            <Link href="/admin" className="flex items-center gap-2 text-sm font-medium py-2 text-orange-600" onClick={() => setMobileOpen(false)}>
              <Shield className="w-4 h-4" /> CEO Panel
            </Link>
          )}

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

