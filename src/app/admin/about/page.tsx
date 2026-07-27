"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, Save } from "lucide-react";

export interface AboutSettings {
  ceoName: string;
  ceoEmail: string;
  ceoPhone: string;
  ceoImageUrl: string;
  companySubtext: string;
  companyLink: string;
  aboutContent: string;
  ceoMessage: string;
}

export default function AdminAboutPage() {
  const [settings, setSettings] = useState<AboutSettings>({
    ceoName: "",
    ceoEmail: "",
    ceoPhone: "",
    ceoImageUrl: "",
    companySubtext: "",
    companyLink: "",
    aboutContent: "",
    ceoMessage: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchAboutSettings();
  }, []);

  const fetchAboutSettings = async () => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "about", "latest"));
      if (docSnap.exists()) {
        setSettings(docSnap.data() as AboutSettings);
      }
    } catch (error) {
      console.error("Error fetching about settings:", error);
      toast.error("Failed to load About settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalImageUrl = settings.ceoImageUrl;

      if (imageFile) {
        const fileRef = ref(storage, `ceo_images/${Date.now()}_${imageFile.name}`);
        await uploadBytes(fileRef, imageFile);
        finalImageUrl = await getDownloadURL(fileRef);
      }

      await setDoc(doc(db, "about", "latest"), {
        ...settings,
        ceoImageUrl: finalImageUrl,
        updatedAt: new Date().toISOString()
      });
      toast.success("About page settings saved successfully");
    } catch (error) {
      console.error("Error saving about settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Info className="w-6 h-6 text-primary" /> About & CEO Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage the content for the public About Us page.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>CEO Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CEO Name</Label>
                <Input 
                  value={settings.ceoName} 
                  onChange={e => setSettings({ ...settings, ceoName: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>CEO Email</Label>
                <Input 
                  type="email"
                  value={settings.ceoEmail} 
                  onChange={e => setSettings({ ...settings, ceoEmail: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>CEO Phone Number</Label>
                <Input 
                  type="tel"
                  value={settings.ceoPhone} 
                  onChange={e => setSettings({ ...settings, ceoPhone: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <Label>Company Subtext (e.g. Founder of...)</Label>
                <Input 
                  value={settings.companySubtext} 
                  onChange={e => setSettings({ ...settings, companySubtext: e.target.value })} 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Company Link URL</Label>
                <Input 
                  type="url"
                  placeholder="https://..."
                  value={settings.companyLink} 
                  onChange={e => setSettings({ ...settings, companyLink: e.target.value })} 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>CEO Image (URL or Upload)</Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    type="url"
                    placeholder="https://example.com/ceo-photo.jpg"
                    value={settings.ceoImageUrl} 
                    onChange={e => {
                      setSettings({ ...settings, ceoImageUrl: e.target.value });
                      setImageFile(null);
                      setPreviewUrl(null);
                    }} 
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap">OR</span>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setImageFile(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                      className="flex-1"
                    />
                  </div>
                </div>
                {(previewUrl || settings.ceoImageUrl) && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Preview:</p>
                    <img 
                      src={previewUrl || settings.ceoImageUrl} 
                      alt="CEO Preview" 
                      className="w-40 h-40 object-cover rounded-xl border border-border" 
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>CEO Message</Label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Message from the CEO..."
                value={settings.ceoMessage}
                onChange={e => setSettings({ ...settings, ceoMessage: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>About Us Content</CardTitle>
            <CardDescription>Main text displayed on the About page.</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="flex min-h-[250px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Osusu 9ja is..."
              value={settings.aboutContent}
              onChange={e => setSettings({ ...settings, aboutContent: e.target.value })}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
