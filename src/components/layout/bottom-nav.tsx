"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Map, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Timeline", icon: Globe },
  { href: "/map", label: "Carte", icon: Map },
  { href: "/explore", label: "Explorer", icon: Compass },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
      <nav className="container relative flex h-16 max-w-2xl items-center justify-around">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return(
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-20",
                isActive
                  ? "text-primary-foreground font-bold"
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              <link.icon className={cn("h-6 w-6", isActive && 'text-primary')} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}