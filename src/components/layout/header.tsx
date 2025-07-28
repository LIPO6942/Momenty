"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const pathname = usePathname();

  const getTitle = () => {
    switch (pathname) {
      case "/":
        return "Fi9";
      case "/journal":
        return "Journal";
      case "/login":
        return "Profil";
       case "/calendar":
        return "Calendrier";
       case "/settings":
        return "Réglages";
      default:
        return "Fi9";
    }
  };
  
  const showBackButton = !['/', '/journal', '/login'].includes(pathname);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        <div className="w-10">
          {showBackButton && (
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        <h1 className="text-xl font-bold text-center flex-1">{getTitle()}</h1>
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
