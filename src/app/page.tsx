"use client";

import { useContext } from "react";
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
        <p className="font-bold text-sm text-foreground">{instant.title}</p>
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
        return format(parsedDate, 'd MMMM yyyy', { locale: fr });
    } catch (error) {
        console.error("Invalid date format:", date, error);
        return "Invalid date";
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-4 sm:px-4 pt-24">
       <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Bienvenue sur InsTXP</h1>
        <p className="text-muted-foreground">Voici le résumé de vos voyages.</p>
      </div>

      <div className="space-y-10">
        {Object.entries(groupedInstants).map(([day, dayData]) => (
          <div key={day}>
            <h2 className="text-lg font-bold text-foreground mb-4">{dayData.title}</h2>
            <div className="space-y-6">
              {dayData.instants.map((instant) => (
                <Card key={instant.id} className="overflow-hidden rounded-xl border-none shadow-md shadow-slate-200/80">
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                         <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", instant.color)}>
                           {instant.icon}
                         </div>
                         <div className="flex flex-col">
                            <span className="font-bold text-sm">{instant.location}</span>
                            <span className="text-xs text-muted-foreground">{getInstantDate(instant.date)}</span>
                         </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
