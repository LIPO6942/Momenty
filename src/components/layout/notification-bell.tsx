"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Download, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { AppNotification } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "notifications"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            })) as AppNotification[];
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (id: string) => {
        if (!user) return;
        await updateDoc(doc(db, "users", user.uid, "notifications", id), {
            read: true
        });
    };

    const markAllAsRead = async () => {
        if (!user || unreadCount === 0) return;
        const batch = writeBatch(db);
        notifications.filter(n => !n.read).forEach(n => {
            batch.update(doc(db, "users", user.uid!, "notifications", n.id), { read: true });
        });
        await batch.commit();
    };

    const deleteNotification = async (id: string) => {
        if (!user) return;
        await deleteDoc(doc(db, "users", user.uid, "notifications", id));
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-full w-10 h-10">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white border-2 border-background">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                            Tout lire
                        </Button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            Aucune notification pour le moment.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors relative group",
                                        !n.read && "bg-blue-50/50"
                                    )}
                                    onClick={() => !n.read && markAsRead(n.id)}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="space-y-1">
                                            <p className="text-sm">
                                                <span className="font-semibold">{n.senderName}</span> vous a partagé l'itinéraire <span className="italic">"{n.itineraryTitle}"</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: fr })}
                                            </p>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteNotification(n.id);
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <Button asChild size="sm" variant="outline" className="h-8 text-xs flex-1">
                                            <Link href={`/share/itinerary/${n.shareToken}`} target="_blank">
                                                <ExternalLink className="mr-1 h-3 w-3" /> Voir
                                            </Link>
                                        </Button>
                                        <Button asChild size="sm" className="h-8 text-xs flex-1">
                                            <Link href={`/itineraires?import=${n.shareToken}`}>
                                                <Download className="mr-1 h-3 w-3" /> Importer
                                            </Link>
                                        </Button>
                                    </div>
                                    {!n.read && (
                                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-2 border-t text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setOpen(false)} asChild>
                        <Link href="/itineraires">Gérer mes itinéraires</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
