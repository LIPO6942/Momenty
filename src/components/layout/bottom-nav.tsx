

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Map, BookText, Plus, Users, Utensils, Home, Route } from "lucide-react";
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
  { href: "/map", label: "Carte", icon: Map },
];

const featureLinks = [
  { href: "/plats", label: "Plats", icon: Utensils },
  { href: "/logements", label: "Logements", icon: Home },
  { href: "/rencontres", label: "Rencontres", icon: Users },
]

export default function BottomNav() {
  const pathname = usePathname();
  const [isTripActive, setIsTripActive] = React.useState(false);

  React.useEffect(() => {
    const checkTripStatus = () => {
      const activeTrip = localStorage.getItem('activeTrip');
      setIsTripActive(!!activeTrip);
    }
    checkTripStatus(); // Check on mount
    window.addEventListener('storage', checkTripStatus); // Listen for changes
    return () => {
      window.removeEventListener('storage', checkTripStatus);
    }
  }, []);

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

            {isTripActive && (
                 <Tooltip>
                    <TooltipTrigger asChild>
                    <Link
                        href="/itineraire"
                        className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                        pathname === "/itineraire"
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-secondary"
                        )}
                    >
                        <Route className="h-5 w-5" />
                    </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>Itinéraire</p>
                    </TooltipContent>
                </Tooltip>
            )}

          <AddInstantDialog>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                 <TooltipContent>
                    <p>Ajouter un instant</p>
                </TooltipContent>
            </Tooltip>
          </AddInstantDialog>

          {featureLinks.map((link) => {
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
        </nav>
      </div>
    </TooltipProvider>
  );
}
