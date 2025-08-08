
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Map, BookText, Plus, Users, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddInstantDialog } from "../timeline/add-instant-dialog";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navLinks = [
  { href: "/", label: "Timeline", icon: Globe },
  { href: "/story", label: "Histoires", icon: BookText },
  { href: "/plats", label: "Plats", icon: Utensils },
  { href: "/map", label: "Carte", icon: Map },
  { href: "/rencontres", label: "Rencontres", icon: Users },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <nav className="flex items-center gap-1 rounded-full bg-card p-1 shadow-lg ring-1 ring-black/5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{link.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          <Tooltip>
             <AddInstantDialog>
                <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
            </AddInstantDialog>
            <TooltipContent>
                <p>Ajouter un instant</p>
            </TooltipContent>
          </Tooltip>
        </nav>
      </div>
    </TooltipProvider>
  );
}
