"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/store/useAuth";
import { collection, query, limit, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { Search, Users, Shield, TrendingUp, ArrowRight, Phone, Mail } from "lucide-react";
import { Reviews } from "@/components/Reviews";
import { FinancialNews } from "@/components/FinancialNews";
import { AppSettings } from "./admin/settings/page";
import { calculateExpectedPayout } from "@/lib/calculations";

// Fallback image - using a data URI SVG placeholder (no local file needed)
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 1200 600'%3E%3Crect width='1200' height='600' fill='%231a1a2e'/%3E%3Ctext x='50%25' y='45%25' font-family='Arial' font-size='48' fill='%23f59e0b' text-anchor='middle' dy='.3em'%3E💰 Osusu%3C/text%3E%3Ctext x='50%25' y='55%25' font-family='Arial' font-size='24' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EBuild Wealth Together%3C/text%3E%3C/svg%3E";

export default function Home() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Real-time listener for groups
    const q = query(collection(db, "groups"), orderBy("createdAt", "desc"), limit(20));
    const unsubscribeGroups = onSnapshot(q, (querySnapshot) => {
      const fetchedGroups: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.isPrivate && data.visibility !== "private") {
          fetchedGroups.push({ id: doc.id, ...data });
        }
      });
      setGroups(fetchedGroups.slice(0, 10));
    }, (error) => {
      console.error("Error fetching groups real-time:", error);
    });

    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "appConfig"));
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as AppSettings);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();

    return () => unsubscribeGroups();
  }, []);

  // Image rotation with smooth transition based on global time
  useEffect(() => {
    if (settings?.heroImages && settings.heroImages.length > 1) {
      const intervalDuration = 15000;
      // Seed initial index based on global time
      setCurrentImageIdx(Math.floor(Date.now() / intervalDuration) % settings.heroImages.length);

      const interval = setInterval(() => {
        setImageLoaded(false); // Reset for next image
        setImageError(false);
        setCurrentImageIdx(Math.floor(Date.now() / intervalDuration) % settings.heroImages.length);
      }, intervalDuration);
      return () => clearInterval(interval);
    }
  }, [settings?.heroImages]);

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Determine which image to show
  const heroImages = settings?.heroImages || [];
  const hasImages = heroImages.length > 0;
  const heroImageSrc = hasImages && !imageError
    ? heroImages[currentImageIdx] || FALLBACK_IMAGE
    : FALLBACK_IMAGE;

  const heroText = settings?.heroText || "Create or join a transparent, secure, and reliable Osusu group with people you trust. Track every payment, every payout, every naira.";

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Section with Smooth Image Transition */}
      <div className="relative w-full min-h-[400px] md:min-h-[560px] overflow-hidden bg-background">
        {/* Image with smooth fade transition */}
        <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
          <Image
            src={heroImageSrc}
            alt="Osusu Group Contribution"
            fill
            className={`
              object-cover brightness-[0.4] 
              transition-all duration-500 ease-in-out
              ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
            `}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
            priority
            key={heroImageSrc} // Forces re-render on image change
            sizes="100vw"
          />
        </div>

        {/* Loading shimmer effect while image loads */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-background via-muted/30 to-background animate-pulse" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background/60" />

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 md:px-8 py-16 md:py-24 max-w-4xl mx-auto min-h-[400px] md:min-h-[560px]">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-5 leading-tight animate-in slide-in-from-bottom-5">
            Build Wealth{" "}
            <span className="bg-gradient-to-r from-orange-300 to-yellow-200 bg-clip-text text-transparent">
              Together
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 md:mb-10 max-w-2xl leading-relaxed animate-in slide-in-from-bottom-6 fade-in duration-700">
            {heroText}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto animate-in slide-in-from-bottom-8 fade-in duration-1000">
            <Link
              href="/create-group"
              className={buttonVariants({
                size: "lg",
                className: "bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 text-white font-semibold text-base px-6 md:px-8 h-12 rounded-full shadow-lg shadow-primary/25 w-auto",
              })}
            >
              Create a Group
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            {user ? (
              <Link
                href="/dashboard"
                className={buttonVariants({
                  size: "lg",
                  className: "bg-transparent border-2 border-white/50 hover:border-white text-white hover:bg-white/10 font-semibold text-base px-6 md:px-8 h-12 rounded-full w-auto transition-all",
                })}
              >
                My Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            ) : (
              <Link
                href="/login"
                className={buttonVariants({
                  size: "lg",
                  className: "bg-transparent border-2 border-white/50 hover:border-white text-white hover:bg-white/10 font-semibold text-base px-6 md:px-8 h-12 rounded-full w-auto transition-all",
                })}
              >
                Join Osusu
              </Link>
            )}
          </div>

          {/* Image indicator dots (optional) */}
          {hasImages && heroImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {heroImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setImageLoaded(false);
                    setImageError(false);
                    setCurrentImageIdx(idx);
                  }}
                  className={`
                    w-1 h-1 rounded-full transition-all duration-300
                    ${idx === currentImageIdx ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/60'}
                  `}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Features Strip */}
      <div className="border-b border-border/40 bg-card/50">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-8">
          <div className="flex md:grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
            <div className="flex items-center justify-center gap-1 md:gap-4">
              <div className="h-8 w-8 md:h-12 md:w-12 rounded md:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 md:h-6 md:w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-xs md:text-sm">Fully Transparent</h3>
                <p className="hidden md:block text-xs text-muted-foreground">Every payment and payout proof is visible to all members.</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 md:gap-4">
              <div className="h-8 w-8 md:h-12 md:w-12 rounded md:rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <Users className="h-4 w-4 md:h-6 md:w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-xs md:text-sm">Trusted Community</h3>
                <p className="hidden md:block text-xs text-muted-foreground">Trust scores and ratings keep everyone accountable.</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 md:gap-4">
              <div className="h-8 w-8 md:h-12 md:w-12 rounded md:rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <TrendingUp className="h-4 w-4 md:h-6 md:w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-xs md:text-sm">Low Fees</h3>
                <p className="hidden md:block text-xs text-muted-foreground">Max ₦500 or 0.5% charge cap to protect members.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discover Groups */}
      <div className="container max-w-7xl mx-auto py-14 md:py-20 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Discover Groups</h2>
            <p className="text-muted-foreground text-sm">Find an Osusu group that fits your budget.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search groups..."
              className="pl-10 h-11 rounded-full bg-muted/50 border-border/90 focus:bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse h-64 bg-muted border-border/30" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map(group => (
              <Card
                key={group.id}
                className="overflow-hidden border-border/30 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group/card"
              >
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
                    {group.payoutChargeType === "none" ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 whitespace-nowrap text-[10px]">
                        No Fee
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 whitespace-nowrap text-[10px]">
                        Fee: {group.payoutChargeType === "fixed" ? `₦${group.payoutChargeValue}` : `${group.payoutChargeValue * 100}%`}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-muted-foreground text-xs">
                    {group.duration} Months · Payout on {group.payoutDay}th
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-muted-foreground">Contribution</span>
                    <span className="font-bold text-sm text-foreground">
                      {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(group.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-muted-foreground">Expected Payout</span>
                    <span className="font-bold text-base text-primary">
                      {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(
                        calculateExpectedPayout(group.amount, group.totalMembers, group.payoutChargeType, group.payoutChargeValue)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Members</span>
                    <span className="text-sm font-medium">0 / {group.totalMembers}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link
                    href={`/join/${group.refCode}`}
                    className={buttonVariants({
                      variant: "outline",
                      className: "w-full rounded-full group-hover/card:border-primary/50 group-hover/card:text-primary transition-colors",
                    })}
                  >
                    View Details
                  </Link>
                </CardFooter>
              </Card>
            ))}

            {filteredGroups.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No active groups found</p>
                <p className="text-sm mt-1">Try a different search or create your own group.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Financial News Section */}
      <div className="mx-auto py-4 md:py-6 px-2 md:px-6">
        <FinancialNews />
      </div>

      {/* Reviews Section */}
      <Reviews />

      {/* Customer Care Banner */}
      {settings && (
        <div className="bg-primary/5 border-b border-primary/10 py-2">
          <div className="container mx-auto px-4 md:px-6 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs sm:text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-primary" /> {settings.contactPhone}</span>
            <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-primary" /> {settings.contactEmail}</span>
            <Link href="/contact" className="hover:text-primary transition-colors hover:underline">Need Help?</Link>
          </div>
        </div>
      )}

    </div>
  );
}