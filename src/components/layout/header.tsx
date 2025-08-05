"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Settings, PlusSquare } from "lucide-react";
import { AddNoteDialog } from "../timeline/add-note-dialog";
import { AddPhotoDialog } from "../timeline/add-photo-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-foreground">InsTXP</Link>
        </div>
        <div className="flex items-center justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <PlusSquare className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                 <AddNoteDialog trigger={addNoteTrigger} />
                 <AddPhotoDialog trigger={addPhotoTrigger} />
              </DropdownMenuContent>
            </DropdownMenu>

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