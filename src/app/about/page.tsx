"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Mail, Phone, ExternalLink } from "lucide-react";
import { AboutSettings } from "@/app/admin/about/page";

export default function AboutPage() {
  const [settings, setSettings] = useState<AboutSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAbout = async () => {
      try {
        const docSnap = await getDoc(doc(db, "about", "latest"));
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AboutSettings);
        }
      } catch (error) {
        console.error("Error fetching about info:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAbout();
  }, []);

  if (loading) {
    return <div className="p-20 text-center animate-pulse text-muted-foreground">Loading...</div>;
  }

  if (!settings) {
    return (
      <div className="container mx-auto py-20 px-6 text-center max-w-2xl">
        <Info className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
        <h1 className="text-2xl font-bold">About Us</h1>
        <p className="text-muted-foreground mt-2">Information is currently being updated. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-16 px-4 md:px-6 max-w-5xl">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">About Osusu 9ja</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold">Our Story</h2>
          <div className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {settings.aboutContent}
          </div>

          {/* CEO Message Section */}
          {settings.ceoMessage && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4">Message from the CEO</h2>
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-orange-500/5">
                <CardContent className="pt-6">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap italic">
                    &ldquo;{settings.ceoMessage}&rdquo;
                  </p>
                  <p className="text-sm font-semibold text-primary mt-4">— {settings.ceoName || "CEO"}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5 overflow-hidden">
            {/* CEO Image */}
            {settings.ceoImageUrl ? (
              <div className="w-full h-95 md:h-80 overflow-hidden">
                <img
                  src={settings.ceoImageUrl}
                  alt={settings.ceoName || "CEO"}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            ) : (
              <div className="w-full h-64 md:h-80 bg-primary/10 flex items-center justify-center">
                <span className="text-5xl font-bold text-primary/40">
                  {settings.ceoName ? settings.ceoName.charAt(0) : "?"}
                </span>
              </div>
            )}

            <CardContent className="pt-4 md:pt-2">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">{settings.ceoName}</h3>
                <p className="text-sm text-primary font-medium">CEO & Founder</p>
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>{settings.companySubtext}</p>
                  {settings.companyLink && (
                    <a href={settings.companyLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center justify-center gap-1 mt-1">
                      Visit Store <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-primary/10">
                <div className="flex justify-center items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${settings.ceoEmail}`} className="hover:text-primary transition-colors truncate">
                    {settings.ceoEmail}
                  </a>
                </div>
                <div className="flex justify-center items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${settings.ceoPhone}`} className="hover:text-primary transition-colors">
                    {settings.ceoPhone}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
