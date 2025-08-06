
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Settings, PlusSquare, Search, Plane, Anchor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TripDialog } from "../timeline/trip-dialog";
import { StayDialog } from "../timeline/stay-dialog";


export default function Header() {
  return (
    <header className="fixed top-0 z-40 w-full p-4">
      <div className="container flex h-16 max-w-2xl items-center justify-between rounded-full bg-card/80 backdrop-blur-sm p-2 shadow-lg ring-1 ring-black/5 mx-auto">
        <div className="flex items-center gap-2 pl-4">
            <Link href="/" className="text-2xl font-bold text-foreground">InsTXP</Link>
        </div>
        <div className="flex items-center justify-end gap-2">
            <TripDialog>
              <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
                <Plane className="h-5 w-5" />
              </Button>
            </TripDialog>

            <StayDialog>
               <Button variant="ghost" size="icon" className="rounded-full w-10 h-10">
                <Anchor className="h-5 w-5" />
              </Button>
            </StayDialog>

            <Button variant="ghost" size="icon" className="rounded-full w-10 h-10" asChild>
                <Link href="/explore">
                    <Search className="h-6 w-6" />
                </Link>
            </Button>

            <Button variant="ghost" size="icon" className="rounded-full w-12 h-12" asChild>
                <Link href="/login">
                  <User className="h-7 w-7" />
                </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
