
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Map, Compass, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddInstantSheet } from "../timeline/add-instant-sheet";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navLinks = [
  { href: "/", label: "Timeline", icon: Globe },
  { href: "/map", label: "Carte", icon: Map },
  { href: "/explore", label: "Explorer", icon: Compass },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <nav className="flex items-center gap-2 rounded-full bg-card p-2 shadow-lg ring-1 ring-black/5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <link.icon className="h-6 w-6" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{link.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          <Tooltip>
            <TooltipTrigger asChild>
                <AddInstantSheet>
                    <Button
                      variant="default"
                      size="icon"
                      className="h-14 w-14 rounded-full"
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                </AddInstantSheet>
            </TooltipTrigger>
            <TooltipContent>
                <p>Ajouter un instant</p>
            </TooltipContent>
          </Tooltip>
        </nav>
      </div>
    </TooltipProvider>
  );
}
