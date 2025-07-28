"use client";

import { useContext } from "react";
import { Calendar, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimelineContext } from "@/context/timeline-context";
import { EditNoteDialog } from "@/components/timeline/edit-note-dialog";

export default function TimelinePage() {
  const { events, deleteEvent } = useContext(TimelineContext);

  // Group events by date
  const groupedEvents = events.reduce((acc, event) => {
    const date = new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const getTodayDateKey = () => {
    return new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  const todayKey = getTodayDateKey();
  const todayEvents = groupedEvents[todayKey] || [];

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Ma journée</h1>
        <Button variant="ghost" size="icon"><Calendar className="h-5 w-5" /></Button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-muted-foreground">Aujourd'hui</h2>
        </div>
        
        {todayEvents.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((event) => (
          <Card key={event.id} className={`rounded-2xl ${event.color}`}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-background/60">
                {event.icon}
              </div>
              <div className="flex-grow">
                <p className="font-bold">{event.title}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <span>{new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short'})}</span>
                  <span>•</span>
                  <span>{new Date(event.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="truncate">• {event.description}</span>
                </div>
              </div>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
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
            </CardContent>
          </Card>
        ))}
         {(!groupedEvents[todayKey] || groupedEvents[todayKey].length === 0) && (
            <div className="text-center py-10 text-muted-foreground">
                <p>Aucun événement aujourd'hui.</p>
                <p className="text-sm">Cliquez sur le bouton "+" pour commencer.</p>
            </div>
        )}
      </div>
    </div>
  );
}
