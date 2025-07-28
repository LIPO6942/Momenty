"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Calendar, BookText, Smile, MapPin, Image as ImageIcon, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { AddPhotoDialog } from "../timeline/add-photo-dialog";
import { AddNoteDialog } from "../timeline/add-note-dialog";
import { AddMoodDialog } from "../timeline/add-mood-dialog";

const navLinks = [
  { href: "/", label: "Timeline", icon: Home },
  { href: "/journal", label: "Journal", icon: Calendar },
];

const addActions = [
    { label: "Note écrite", icon: BookText, color: "text-purple-700", component: AddNoteDialog },
    { label: "Note vocale", icon: Mic, color: "text-orange-700", component: null },
    { label: "Photo", icon: ImageIcon, color: "text-accent-foreground", component: AddPhotoDialog },
    { label: "Lieu", icon: MapPin, color: "text-blue-700", component: null },
    { label: "Humeur", icon: Smile, color: "text-green-700", component: AddMoodDialog },
]

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
      <nav className="container relative flex h-16 items-center justify-around">
        {navLinks.map((link, index) => {
          const isActive = pathname === link.href;
          const content = (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors w-20",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:bg-accent/50"
              )}
            >
              <link.icon className="h-6 w-6" />
              <span className="text-xs font-medium sr-only">{link.label}</span>
            </Link>
          );
          
          // Insert the SheetTrigger in the middle
          if (index === 0) {
            return (
              <>
                {content}
                <Sheet>
                    <SheetTrigger asChild>
                         <Button size="icon" className="h-16 w-16 rounded-full shadow-lg absolute -top-8 left-1/2 -translate-x-1/2 bg-primary hover:bg-primary/90">
                            <PlusCircle className="h-8 w-8" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="rounded-t-2xl">
                        <SheetHeader className="mb-4">
                            <SheetTitle className="text-center">Ajouter un événement</SheetTitle>
                        </SheetHeader>
                        <div className="grid grid-cols-3 gap-4">
                            {addActions.map((action) => {
                                const ActionComponent = action.component;
                                const content = (
                                     <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent/50 cursor-pointer">
                                        <div className={cn("p-3 rounded-full bg-background/80", action.color)}>
                                            <action.icon className="h-6 w-6" />
                                        </div>
                                        <span className="text-xs text-center font-medium">{action.label}</span>
                                    </div>
                                );

                                if (ActionComponent) {
                                    return <ActionComponent key={action.label} trigger={content} />;
                                }

                                return (
                                    <div key={action.label}>
                                        {content}
                                    </div>
                                );
                            })}
                        </div>
                    </SheetContent>
                </Sheet>
              </>
            );
          }
          
          return content;
        })}
      </nav>
    </div>
  );
}