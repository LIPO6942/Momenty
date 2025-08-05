"use client";

import { useContext } from "react";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

export default function TimelinePage() {
  const { groupedInstants, deleteInstant } = useContext(TimelineContext);

  const getInstantTime = (date: string) => {
    try {
        const parsedDate = parseISO(date);
        return format(parsedDate, 'HH:mm');
    } catch (error) {
        console.error("Invalid date format:", date, error);
        return "Invalid time";
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {Object.entries(groupedInstants).map(([day, dayData]) => (
        <div key={day} className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 sticky top-0 bg-background/80 backdrop-blur-sm py-3 z-10">
            {dayData.title}
          </h2>
          <div className="relative pl-8">
            {/* Central timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border/80"></div>
            
            <div className="space-y-10">
              {dayData.instants.map((instant) => (
                <div key={instant.id} className="relative flex items-start">
                  {/* Node on the timeline */}
                  <div className={cn(
                    "absolute left-8 top-1 w-8 h-8 rounded-full -translate-x-1/2 flex items-center justify-center text-white", 
                    instant.color
                  )}>
                    {instant.icon}
                  </div>
                  
                  <div className="ml-16 w-full">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-grow">
                             <div className="flex items-center gap-2 mb-2">
                                <p className="font-bold text-base text-foreground">{instant.title}</p>
                                <p className="text-xs text-muted-foreground">{getInstantTime(instant.date)}</p>
                              </div>
                            <p className="text-muted-foreground text-sm">{instant.description}</p>
                            <p className="text-xs text-muted-foreground/80 mt-2">{instant.location}</p>
                          </div>
                          <div>
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
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
