"use client";

import { useContext } from "react";
import { Calendar, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimelineContext } from "@/context/timeline-context";
import { EditNoteDialog } from "@/components/timeline/edit-note-dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function TimelinePage() {
  const { events, deleteEvent } = useContext(TimelineContext);

  const getEventTime = (date: string) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  
  const getEventDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  const sortedEvents = events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Ma journée</h1>
        <Button variant="ghost" size="icon"><Calendar className="h-5 w-5" /></Button>
      </div>

      <div className="relative">
        {/* Central timeline line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-muted -translate-x-1/2"></div>
        
        <div className="space-y-12">
          {sortedEvents.map((event, index) => {
            const isLeft = index % 2 !== 0;
            const previousEvent = sortedEvents[index + 1];
            const showDate = !previousEvent || new Date(event.date).getDate() !== new Date(previousEvent.date).getDate();

            return (
              <div key={event.id} className="relative">
                {/* Node on the timeline */}
                <div className={cn("absolute left-1/2 top-0 w-3 h-3 rounded-full -translate-x-1/2", event.color)}></div>
                
                 {/* Date Badge */}
                 {showDate && (
                  <div className="absolute left-1/2 top-8 -translate-x-1/2">
                     <p className="p-1 px-3 bg-accent text-accent-foreground rounded-md inline-block text-xs font-bold">{getEventDate(event.date)}</p>
                  </div>
                )}

                <div className={cn(
                  "w-[calc(50%-1.5rem)]",
                   isLeft ? "ml-0" : "ml-[calc(50%+1.5rem)]"
                )}>
                    <div className={cn("flex flex-col", isLeft ? 'items-end' : 'items-start')}>
                      <div className={cn("flex items-center gap-2", isLeft ? "flex-row-reverse" : "flex-row")}>
                         <div className="p-1 rounded-full bg-background/60 inline-block">
                          {event.icon}
                        </div>
                         <h3 className="font-bold text-sm">{event.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">{event.description}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{getEventTime(event.date)}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 mt-1">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isLeft ? "end" : "start"}>
                          <EditNoteDialog eventToEdit={event}>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Modifier</span>
                            </DropdownMenuItem>
                          </EditNoteDialog>
                          <DropdownMenuItem onClick={() => deleteEvent(event.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Supprimer</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
