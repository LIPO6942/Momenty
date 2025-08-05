"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Map, Compass, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddNoteDialog } from "../timeline/add-note-dialog";
import { AddPhotoDialog } from "../timeline/add-photo-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";

const navLinks = [
  { href: "/", label: "Timeline", icon: Globe },
  { href: "/map", label: "Carte", icon: Map },
  { href: "/explore", label: "Explorer", icon: Compass },
];

const addNoteTrigger = (
  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
    Ajouter une note
  </DropdownMenuItem>
);

const addPhotoTrigger = (
  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
    Ajouter une photo
  </DropdownMenuItem>
);

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <nav className="flex items-center gap-2 rounded-full bg-card p-2 shadow-lg ring-1 ring-black/5">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
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
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="h-14 w-14 rounded-full"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mb-2">
            <AddNoteDialog trigger={addNoteTrigger} />
            <AddPhotoDialog trigger={addPhotoTrigger} />
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </div>
  );
}
