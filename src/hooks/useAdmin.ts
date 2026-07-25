"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/store/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const CEO_UID = "srmS0wC9OeczVXnzB3VN1C5YYUS2";

export interface AdminData {
  uid: string;
  email: string;
  routes: string[];
}

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCEO, setIsCEO] = useState(false);
  const [adminRoutes, setAdminRoutes] = useState<string[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;

      if (!user) {
        setIsAdmin(false);
        setIsCEO(false);
        setAdminRoutes([]);
        setLoadingAdmin(false);
        return;
      }

      if (user.uid === CEO_UID) {
        setIsAdmin(true);
        setIsCEO(true);
        // CEO has access to everything, but we can assign a wildcard or leave empty
        setAdminRoutes(["*"]);
        setLoadingAdmin(false);
        return;
      }

      try {
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        if (adminDoc.exists()) {
          setIsAdmin(true);
          setIsCEO(false);
          setAdminRoutes(adminDoc.data().routes || []);
        } else {
          setIsAdmin(false);
          setIsCEO(false);
          setAdminRoutes([]);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setLoadingAdmin(false);
      }
    };

    checkAdmin();
  }, [user, authLoading]);

  return { isAdmin, isCEO, adminRoutes, loadingAdmin };
}
