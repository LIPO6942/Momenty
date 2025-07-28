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
    return new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }).toUpperCase();
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Ma journée</h1>
        <Button variant="ghost" size="icon"><Calendar className="h-5 w-5" /></Button>
      </div>

      <div className="relative">
        <Separator orientation="vertical" className="absolute left-1/2 -ml-[1px] h-full" />
        <div className="space-y-12">
          {events.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((event, index) => (
            <div key={event.id} className="relative">
               {/* Timeline Node */}
               <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-primary-foreground/50"></div>

               <div className={cn(
                   "flex items-center",
                   index % 2 === 0 ? "flex-row-reverse" : ""
               )}>
                   <div className="w-1/2 px-4">
                       <div className={cn(
                           "p-1 px-3 bg-accent text-accent-foreground rounded-md inline-block mb-2 torn-paper",
                           index % 2 === 0 ? "float-left" : "float-right"
                       )}>
                           <p className="font-bold text-sm">{getEventDate(event.date)}</p>
                       </div>
                   </div>
                   <div className="w-1/2 px-4"></div>
               </div>

               <div className={cn("mt-2", index % 2 === 0 ? "w-1/2 pr-12" : "w-1/2 ml-auto pl-12 text-right")}>
                  <div className="flex items-center gap-2">
                     <div className={cn("p-2 rounded-full bg-background/60 inline-block", index % 2 === 0 ? "" : "ml-auto")}>
                        {event.icon}
                      </div>
                      <h3 className="font-bold">{event.title}</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">{event.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>

                   <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn("h-8 w-8 mt-2", index % 2 === 0 ? "" : "ml-auto")}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={index % 2 === 0 ? "start" : "end"}>
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
          ))}
        </div>
      </div>
    </div>
  );
}
