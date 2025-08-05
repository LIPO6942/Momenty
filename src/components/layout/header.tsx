"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Settings, PlusSquare, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


export default function Header() {
  return (
    <header className="fixed top-0 z-40 w-full p-4">
      <div className="container flex h-16 max-w-2xl items-center justify-between rounded-full bg-card p-2 shadow-lg ring-1 ring-black/5 mx-auto">
        <div className="flex items-center gap-2 pl-4">
            <Link href="/" className="text-xl font-bold text-foreground">InsTXP</Link>
        </div>
        <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="icon" className="rounded-full" asChild>
                <Link href="/login">
                  <User className="h-5 w-5" />
                </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
