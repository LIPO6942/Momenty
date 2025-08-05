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

export default function TimelinePage() {
  const { groupedInstants, deleteInstant } = useContext(TimelineContext);

  const getInstantDate = (date: string) => {
    try {
        const parsedDate = parseISO(date);
        return format(parsedDate, "d MMMM yyyy 'à' HH:mm", { locale: fr });
    } catch (error) {
        console.error("Invalid date format:", date, error);
        return "Date invalide";
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
       <div className="py-16 space-y-2">
        <h1 className="text-4xl font-bold text-primary">Bienvenue sur InsTXP</h1>
        <p className="text-muted-foreground">Voici le résumé de vos voyages.</p>
      </div>

      <div className="space-y-10">
        {Object.entries(groupedInstants).map(([day, dayData]) => (
          <div key={day}>
            <h2 className="text-xl font-bold text-foreground mb-4">{dayData.title}</h2>
            <div className="space-y-6">
              {dayData.instants.map((instant) => (
                <Card key={instant.id} className="overflow-hidden rounded-xl border-none shadow-md shadow-slate-200/80">
                  <CardHeader className={cn("flex flex-row items-center justify-between p-4", instant.color)}>
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 flex items-center justify-center">
                           {React.cloneElement(instant.icon as React.ReactElement, { className: "h-7 w-7 text-white" })}
                         </div>
                         <div className="flex flex-col text-white/90">
                            <span className="font-bold text-base">{instant.location}</span>
                            <span className="text-sm">{getInstantDate(instant.date)}</span>
                         </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white hover:bg-white/20 focus-visible:text-white">
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
                    {instant.category && <Badge variant="secondary">{instant.category}</Badge>}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
