
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Settings, PlusSquare, Bookmark, Plane, Anchor, LogOut, WifiOff, RefreshCw } from "lucide-react";
import { useContext } from "react";
import { TimelineContext } from "@/context/timeline-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TripDialog } from "../timeline/trip-dialog";
import { StayDialog } from "../timeline/stay-dialog";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";
// Removed NotificationBell as per user request to move it to settings


export default function Header() {
  const { user, logout } = useAuth();
  const { isOnline, isSyncing } = useContext(TimelineContext);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
     if (!user) {
         setUnreadCount(0);
         return;
     }
     const q = query(
        collection(db, "users", user.uid, "notifications"),
        where("read", "==", false)
     );
     const unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadCount(snapshot.docs.length);
     });
     return () => unsubscribe();
  }, [user]);

  return (
    <header className="fixed top-0 z-40 w-full p-4">
      <div className="container flex h-16 max-w-2xl items-center justify-between rounded-full bg-card/80 backdrop-blur-sm p-2 shadow-lg ring-1 ring-black/5 mx-auto">
        <div className="flex items-center gap-2 pl-4">
            <Link href="/" className="text-2xl font-bold text-foreground">Momenty</Link>
        </div>
        <div className="flex items-center justify-end gap-2">
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-medium animate-pulse">
                <WifiOff className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Hors-ligne</span>
              </div>
            )}

            {isSyncing && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span className="hidden sm:inline">Synchro...</span>
              </div>
            )}

            <TripDialog>
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
                <Plane className="h-5 w-5 text-blue-800" />
              </Button>
            </TripDialog>

            <StayDialog>
               <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
                <Anchor className="h-5 w-5 text-blue-800" />
              </Button>
            </StayDialog>

            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" asChild title="Mes itinéraires">
                <Link href="/itineraires">
                    <Bookmark className="h-6 w-6" />
                </Link>
            </Button>



            {user ? (
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full w-12 h-12">
                       <User className="h-7 w-7 text-yellow-400" />
                       {unreadCount > 0 && (
                          <span className="absolute top-1 right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-background"></span>
                          </span>
                       )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     <DropdownMenuItem asChild>
                        <Link href="/profile">
                           <User className="mr-2 h-4 w-4" />
                           <span>Profil</span>
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link href="/settings" className="relative flex items-center justify-between">
                           <div className="flex items-center">
                             <Settings className="mr-2 h-4 w-4" />
                             <span>Paramètres</span>
                           </div>
                           {unreadCount > 0 && (
                             <span className="ml-2 flex h-2 w-2 rounded-full bg-red-500" />
                           )}
                        </Link>
                     </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Déconnexion</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            ) : (
               <Button variant="ghost" size="icon" className="rounded-full w-12 h-12" asChild>
                <Link href="/login">
                  <User className="h-7 w-7 text-yellow-400" />
                </Link>
            </Button>
            )}
        </div>
      </div>
    </header>
  );
}
