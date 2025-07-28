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
import { cn } from "@/lib/utils";

export default function TimelinePage() {
  const { events, deleteEvent } = useContext(TimelineContext);

  const getEventTime = (date: string) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  const sortedEvents = events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Ma journée</h1>
        <Button variant="ghost" size="icon"><Calendar className="h-5 w-5" /></Button>
      </div>

      <div className="relative pl-4">
        {/* Central timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border/50"></div>
        
        <div className="space-y-8">
          {sortedEvents.map((event, index) => {
            const isLeft = index % 2 !== 0;

            return (
              <div key={event.id} className="relative">
                {/* Node on the timeline */}
                <div className={cn("absolute left-4 top-1 w-3 h-3 rounded-full -translate-x-1/2", event.color)}></div>
                
                <div className={cn(
                  "flex items-start gap-4",
                  isLeft ? "ml-8" : "ml-8" 
                )}>
                  <div className={cn("flex-shrink-0 mt-0.5", isLeft ? 'order-2' : '')}>
                    {event.icon}
                  </div>
                  <div className={cn("flex-grow", isLeft ? 'order-1 text-left' : 'text-left')}>
                    <h3 className="font-bold text-sm">{event.title}</h3>
                    <p className="text-muted-foreground text-sm mt-0.5">{event.description}</p>
                    <p className="text-xs text-muted-foreground/80 mt-1">{getEventTime(event.date)}</p>
                  </div>
                  <div className={cn(isLeft ? 'order-3' : 'order-3')}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isLeft ? "start" : "end"}>
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