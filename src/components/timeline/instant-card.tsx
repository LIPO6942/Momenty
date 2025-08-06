
"use client";

import React, { useContext } from "react";
import Image from "next/image";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimelineContext } from "@/context/timeline-context";
import { EditNoteDialog } from "@/components/timeline/edit-note-dialog";
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Instant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

const InstantContent = ({ instant }: { instant: Instant }) => {
  return (
    <div className="pt-2">
      {instant.photo && (
        <Image
          src={instant.photo}
          alt={instant.title}
          width={500}
          height={300}
          className="w-full rounded-lg object-cover aspect-video"
          data-ai-hint="travel photo"
        />
      )}
      <div className={cn("px-1 py-3", instant.photo && "pt-4")}>
        <p className="font-bold text-lg text-foreground">{instant.title}</p>
        {instant.description && <p className="text-sm text-muted-foreground mt-1">{instant.description}</p>}
      </div>
    </div>
  );
};


export const InstantCard = ({ instant }: { instant: Instant }) => {
    const { deleteInstant } = useContext(TimelineContext);

    return (
        <Card key={instant.id} className="overflow-hidden rounded-xl border-none shadow-md shadow-slate-200/80">
            <CardHeader className="flex flex-row items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 flex items-center justify-center rounded-lg", instant.color)}>
                        {instant.icon && React.cloneElement(instant.icon as React.ReactElement, { className: "h-7 w-7 text-white" })}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base text-foreground">{instant.location}</span>
                        <span className="text-sm text-muted-foreground">{format(parseISO(instant.date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
                    </div>
                </div>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-secondary focus-visible:text-foreground">
                    <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <EditNoteDialog instantToEdit={instant}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Modifier</span>
                    </DropdownMenuItem>
                    </EditNoteDialog>
                    <DropdownMenuItem onClick={() => deleteInstant(instant.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Supprimer</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            
            <CardContent className="p-0 px-4">
              <InstantContent instant={instant} />
            </CardContent>

            <CardFooter className="p-4 pt-2">
                <div className="flex gap-2 flex-wrap">
                    {instant.category && <Badge variant="secondary">{instant.category}</Badge>}
                    {instant.emotion && <Badge variant="outline">{instant.emotion}</Badge>}
                </div>
            </CardFooter>
        </Card>
    )
}
