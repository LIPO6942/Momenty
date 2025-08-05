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
          className="w-full object-cover aspect-video"
          data-ai-hint="travel photo"
        />
      )}
      {instant.description && <p className="text-sm text-foreground px-4 py-3">{instant.description}</p>}
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
    <div className="container mx-auto max-w-2xl px-0 py-4 sm:px-4">
      <div className="space-y-8">
        {Object.entries(groupedInstants).map(([day, dayData]) => (
          <div key={day}>
            <h2 className="text-sm font-semibold text-muted-foreground px-4 mb-4">{dayData.title.toUpperCase()}</h2>
            <div className="space-y-4">
              {dayData.instants.map((instant) => (
                <Card key={instant.id} className="rounded-none sm:rounded-xl border-x-0 sm:border-x">
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                         <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", instant.color)}>
                           {instant.icon}
                         </div>
                         <p className="font-bold text-sm">{instant.title}</p>
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
                  
                  <CardContent className="p-0">
                    <InstantContent instant={instant} />
                  </CardContent>

                  <CardFooter className="p-4 flex flex-col items-start gap-3">
                    {instant.category && <Badge variant="secondary">{instant.category}</Badge>}
                     <div className="flex justify-between w-full text-xs text-muted-foreground">
                        <span>{instant.location}</span>
                        <span>{getInstantDate(instant.date)}</span>
                     </div>
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
