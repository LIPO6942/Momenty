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

  const getEventDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  }

  const getEventTime = (date: string) => {
    return new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Ma journée</h1>
        <Button variant="ghost" size="icon"><Calendar className="h-5 w-5" /></Button>
      </div>

      <div className="relative pl-4">
        {/* Central timeline line */}
        <div className="absolute left-1/2 -translate-x-1/2 h-full w-[2px] bg-muted"></div>

        <div className="space-y-12">
          {events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((event, index) => (
            <div key={event.id} className="relative grid grid-cols-2 gap-x-8">
              
              {/* Left Side */}
              <div className={cn(index % 2 !== 0 ? "text-right" : "text-transparent")}>
                {index % 2 !== 0 && (
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-3">
                       <h3 className="font-bold">{event.title}</h3>
                       <div className="p-2 rounded-full bg-background/60 inline-block">
                          {event.icon}
                        </div>
                    </div>
                    <p className="text-muted-foreground text-sm mt-1">{event.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{getEventTime(event.date)}</p>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 mt-2 ml-auto">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
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
                )}
              </div>

              {/* Timeline Node & Date */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-y-2">
                 <div className="w-4 h-4 rounded-full bg-primary border-2 border-background ring-2 ring-primary/50"></div>
                 {/* Optional: Show date between items */}
                 {(index < events.length - 1) && 
                   (new Date(event.date).getDate() !== new Date(events[index+1].date).getDate()) &&
                   (
                      <div className="my-4">
                        <p className="p-1 px-3 bg-accent text-accent-foreground rounded-md inline-block text-xs font-bold">{getEventDate(events[index+1].date)}</p>
                      </div>
                   )
                 }
              </div>

               {/* Right Side */}
               <div className={cn(index % 2 === 0 ? "text-left" : "text-transparent")}>
                 {index % 2 === 0 && (
                   <div className="flex flex-col items-start">
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-full bg-background/60 inline-block">
                            {event.icon}
                          </div>
                          <h3 className="font-bold">{event.title}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{getEventTime(event.date)}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 mt-2">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
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
                 )}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
