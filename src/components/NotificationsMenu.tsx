"use client";
import { useState, useEffect, useRef } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/useAuth";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
interface AppNotification {
    id: string;
    title: string;
    message: string;
    link?: string;
    buttonText?: string;
    imageUrl?: string;
    userId: string;
    createdAt: any;
}
export function NotificationsMenu() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [readIds, setReadIds] = useState<string[]>([]);
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        // Load local state
        if (typeof window !== "undefined" && user) {
            const storedRead = localStorage.getItem(`read_notifications_${user.uid}`);
            const storedDeleted = localStorage.getItem(`deleted_notifications_${user.uid}`);
            if (storedRead) setReadIds(JSON.parse(storedRead));
            if (storedDeleted) setDeletedIds(JSON.parse(storedDeleted));
        }
    }, [user]);
    useEffect(() => {
        if (!user) return;
        // Fetch notifications targeting the user specifically
    const qUser = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid)
    );

    // Fetch broadcast notifications targeting everyone
    const qAll = query(
      collection(db, "notifications"),
      where("userId", "==", "all")
    );

    const handleSnapshot = (snapshot: any, type: 'user' | 'all') => {
      const list: AppNotification[] = [];
      snapshot.forEach((doc: any) => {
        list.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      
      setNotifications(prev => {
        // Filter out old ones of this type and add new ones
        const otherType = prev.filter(n => type === 'user' ? n.userId === 'all' : n.userId !== 'all');
        const combined = [...otherType, ...list];
        // Sort by createdAt descending
        return combined.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        });
      });
    };

    const unsubscribeUser = onSnapshot(qUser, (snap) => handleSnapshot(snap, 'user'));
    const unsubscribeAll = onSnapshot(qAll, (snap) => handleSnapshot(snap, 'all'));

    return () => {
      unsubscribeUser();
      unsubscribeAll();
    };
    }, [user]);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const visibleNotifications = notifications.filter(n => !deletedIds.includes(n.id));
    const unreadCount = visibleNotifications.filter(n => !readIds.includes(n.id)).length;
    const markAsRead = (id: string) => {
        if (!readIds.includes(id)) {
            const newReadIds = [...readIds, id];
            setReadIds(newReadIds);
            if (user) {
                localStorage.setItem(`read_notifications_${user.uid}`, JSON.stringify(newReadIds));
            }
        }
    };
    const deleteNotification = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newDeletedIds = [...deletedIds, id];
        setDeletedIds(newDeletedIds);
        if (user) {
            localStorage.setItem(`deleted_notifications_${user.uid}`, JSON.stringify(newDeletedIds));
        }
    };
    const clearAll = () => {
        if (confirm("Are you sure you want to clear all notifications?")) {
            const allVisibleIds = visibleNotifications.map(n => n.id);
            const newDeletedIds = [...deletedIds, ...allVisibleIds];
            setDeletedIds(newDeletedIds);
            if (user) {
                localStorage.setItem(`deleted_notifications_${user.uid}`, JSON.stringify(newDeletedIds));
            }
        }
    };
    if (!user) return null;
    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-muted transition-colors focus:outline-none"
            >
                <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-background border border-border shadow-lg rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {visibleNotifications.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 text-xs text-muted-foreground hover:text-destructive">
                                Clear All
                            </Button>
                        )}
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto">
                        {visibleNotifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                                <Bell className="h-8 w-8 mb-2 opacity-20" />
                                No new notifications
                            </div>
                        ) : (
                            <div className="divide-y divide-border/40">
                                {visibleNotifications.map((notif) => {
                                    const isRead = readIds.includes(notif.id);
                                    return (
                                        <div
                                            key={notif.id}
                                            onClick={() => markAsRead(notif.id)}
                                            className={`p-4 hover:bg-muted/30 transition-colors cursor-pointer group relative ${!isRead ? "bg-primary/5" : ""}`}
                                        >
                                            {!isRead && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                                            )}

                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className="font-medium text-sm text-foreground pr-6">{notif.title}</h4>
                                                <button
                                                    onClick={(e) => deleteNotification(e, notif.id)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 text-destructive rounded absolute right-2 top-2"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            <p className="text-xs text-muted-foreground mt-1 mb-2 leading-relaxed">
                                                {notif.message}
                                            </p>
                                            {notif.imageUrl && (
                                                <div className="mb-2 mt-2 rounded-md overflow-hidden bg-muted">
                                                    <img src={notif.imageUrl} alt="Notification media" className="w-full h-auto object-cover max-h-32" />
                                                </div>
                                            )}
                                            {notif.link && (
                                                <a
                                                    href={notif.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 px-2.5 py-1.5 rounded-md mt-1 transition-colors"
                                                >
                                                    {notif.buttonText || "View Link"} <ExternalLink className="h-3 w-3 ml-1.5" />
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
