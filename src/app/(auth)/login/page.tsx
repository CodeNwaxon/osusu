"use client";

import { useEffect, useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { useAuth } from "@/store/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Create new user profile
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || "Anonymous",
          email: user.email,
          phone: user.phoneNumber || "",
          photoURL: user.photoURL || "",
          rating: 5.0, // Default rating
          trustScore: 100, // Default trust score
          completedGroups: 0,
          createdAt: serverTimestamp(),
        });

        // Fetch dynamic welcome message
        let welcomeText = "Thanks for joining Osusu 9ja! Start by creating your own group or joining one with a referral link. Build trust, save together, and grow your wealth.";
        try {
          const settingsDoc = await getDoc(doc(db, "settings", "global"));
          if (settingsDoc.exists() && settingsDoc.data().autoWelcomeMessage) {
            welcomeText = settingsDoc.data().autoWelcomeMessage;
          }
        } catch (err) {
          console.error("Error fetching welcome message", err);
        }

        // Send welcome notification
        await addDoc(collection(db, "notifications"), {
          userId: user.uid,
          title: "Welcome to Osusu 9ja! 🎉",
          message: welcomeText,
          link: "/create-group",
          buttonText: "Create a Group",
          createdAt: serverTimestamp(),
        });
      }

      toast.success("Successfully logged in!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Welcome to Osusu</CardTitle>
          <CardDescription>Sign in to create or join a group contribution</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full h-12 text-lg font-medium"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="animate-pulse">Connecting...</span>
            ) : (
              <>
                <FcGoogle className="mr-2 h-6 w-6" />
                Sign in with Google
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
