
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Settings, PlusSquare, Users, Plane, Anchor, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TripDialog } from "../timeline/trip-dialog";
import { StayDialog } from "../timeline/stay-dialog";
import { useAuth } from "@/context/auth-context";


export default function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="fixed top-0 z-40 w-full p-4">
      <div className="container flex h-16 max-w-2xl items-center justify-between rounded-full bg-card/80 backdrop-blur-sm p-2 shadow-lg ring-1 ring-black/5 mx-auto">
        <div className="flex items-center gap-2 pl-4">
            <Link href="/" className="text-2xl font-bold text-foreground">Momenty</Link>
        </div>
        <div className="flex items-center justify-end gap-2">
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

            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" asChild>
                <Link href="/rencontres">
                    <Users className="h-6 w-6" />
                </Link>
            </Button>

            {user ? (
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full w-12 h-12">
                       <User className="h-7 w-7 text-yellow-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                       <Link href="/profile">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profil</span>
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
