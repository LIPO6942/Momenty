"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Calendar, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

const navLinks = [
  { href: "/", label: "Timeline", icon: Home },
  { href: "/calendar", label: "Calendrier", icon: Calendar },
  { href: "/settings", label: "Réglages", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
      <nav className="container flex h-20 items-center justify-around">
        {navLinks.slice(0, 1).map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-20 h-16",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              <link.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          );
        })}
        
        <Button size="icon" className="h-16 w-16 rounded-full shadow-lg -translate-y-4 bg-primary hover:bg-primary/90">
          <PlusCircle className="h-8 w-8" />
        </Button>

        {navLinks.slice(1).map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-20 h-16",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              <link.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
