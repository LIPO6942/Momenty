"use client";

import { useContext } from "react";
import { MoreVertical, Edit, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function TimelinePage() {
  const { groupedInstants, deleteInstant } = useContext(TimelineContext);

  const getInstantTime = (date: string) => {
    return format(parseISO(date), 'HH:mm');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {Object.entries(groupedInstants).map(([day, dayData]) => (
        <div key={day} className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-4 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
            {dayData.title}
          </h2>
          <div className="relative pl-4">
            {/* Central timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border/50"></div>
            
            <div className="space-y-8">
              {dayData.instants.map((instant) => (
                <div key={instant.id} className="relative">
                  {/* Node on the timeline */}
                  <div className={cn("absolute left-6 top-1 w-3 h-3 rounded-full -translate-x-1/2", instant.color)}></div>
                  
                  <div className="flex items-start gap-4 ml-12">
                    <div className="flex-shrink-0 mt-0.5">
                      {instant.icon}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-bold text-sm">{instant.title}</h3>
                      <p className="text-muted-foreground text-sm mt-0.5">{instant.description}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1">{getInstantTime(instant.date)} - {instant.location}</p>
                    </div>
                    <div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
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
                          <DropdownMenuItem onClick={() => deleteInstant(instant.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
