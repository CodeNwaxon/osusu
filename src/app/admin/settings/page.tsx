"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save, Trash2, Plus, Database } from "lucide-react";

export interface AppSettings {
  siteName: string;
  heroText: string;
  heroImages: string[];
  contactEmail: string;
  contactPhone: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
  };
  notificationExpiryDays?: number;
}

const DEFAULT_MOCK_DATA: AppSettings = {
  siteName: "Osusu 9ja",
  heroText: "Empowering Communities through Collaborative Savings. Join a group and achieve your financial goals today.",
  heroImages: [
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80"
  ],
  contactEmail: "support@osusu9ja.com",
  contactPhone: "+234 800 000 0000",
  socialLinks: {
    facebook: "https://facebook.com/osusu9ja",
    twitter: "https://twitter.com/osusu9ja",
    instagram: "https://instagram.com/osusu9ja",
  },
  notificationExpiryDays: 14
};

export default function SettingsCMSPage() {
  const [settings, setSettings] = useState<AppSettings>({
    siteName: "",
    heroText: "",
    heroImages: [],
    contactEmail: "",
    contactPhone: "",
    socialLinks: { facebook: "", twitter: "", instagram: "" },
    notificationExpiryDays: 14
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "settings", "appConfig"));
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AppSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "appConfig"), settings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAddImage = () => {
    if (settings.heroImages.length >= 10) {
      toast.error("Maximum 10 hero images allowed");
      return;
    }
    setSettings({ ...settings, heroImages: [...settings.heroImages, ""] });
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...settings.heroImages];
    newImages[index] = value;
    setSettings({ ...settings, heroImages: newImages });
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...settings.heroImages];
    newImages.splice(index, 1);
    setSettings({ ...settings, heroImages: newImages });
  };

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> Global Application Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage public site content and details.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Settings */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input 
                value={settings.siteName} 
                onChange={e => setSettings({ ...settings, siteName: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Hero Section Text</Label>
              <Input 
                value={settings.heroText} 
                onChange={e => setSettings({ ...settings, heroText: e.target.value })} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Hero Images */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Hero Images (Live Rotating)</CardTitle>
              <Button variant="outline" size="sm" onClick={handleAddImage} disabled={settings.heroImages.length >= 10}>
                <Plus className="w-4 h-4 mr-2" /> Add Image
              </Button>
            </div>
            <CardDescription>Add up to 10 image URLs to rotate on the home page hero section.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settings.heroImages.map((img, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input 
                  placeholder="https://image-url.com/photo.jpg" 
                  value={img} 
                  onChange={e => handleImageChange(idx, e.target.value)} 
                />
                <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => handleRemoveImage(idx)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                {img && (
                  <img src={img} alt={`Preview ${idx}`} className="w-10 h-10 object-cover rounded-md border" />
                )}
              </div>
            ))}

            {/* Notification Settings */}
            <div className="space-y-4 pt-6 border-t border-border">
              <h3 className="text-lg font-medium text-foreground">Notification Settings</h3>
              <div className="grid gap-4 max-w-sm">
                <div className="space-y-2">
                  <Label htmlFor="notificationExpiryDays">Notification Expiry (Days)</Label>
                  <Input
                    id="notificationExpiryDays"
                    type="number"
                    min="1"
                    value={settings.notificationExpiryDays || 14}
                    onChange={(e) => setSettings({ ...settings, notificationExpiryDays: parseInt(e.target.value) || 14 })}
                    placeholder="14"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of days before user notifications are automatically deleted from the backend.
                  </p>
                </div>
              </div>
            </div>

            {settings.heroImages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hero images added. Will use fallback.</p>
            )}
          </CardContent>
        </Card>

        {/* Customer Care */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Care Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input 
                type="email"
                value={settings.contactEmail} 
                onChange={e => setSettings({ ...settings, contactEmail: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Phone Number</Label>
              <Input 
                type="tel"
                value={settings.contactPhone} 
                onChange={e => setSettings({ ...settings, contactPhone: e.target.value })} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input 
                value={settings.socialLinks.facebook} 
                onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook: e.target.value }})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Twitter URL</Label>
              <Input 
                value={settings.socialLinks.twitter} 
                onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, twitter: e.target.value }})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input 
                value={settings.socialLinks.instagram} 
                onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value }})} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
