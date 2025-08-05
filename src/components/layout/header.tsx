"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Settings } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-foreground">InsTXP</Link>
        </div>
        <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" asChild>
                <Link href="/login">
                  <User className="h-5 w-5" />
                </Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
