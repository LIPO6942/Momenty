"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <div className="flex-1 text-center">
            <h1 className="text-xl font-bold">Fi9</h1>
        </div>
        <div className="flex items-center justify-end gap-2 w-10">
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