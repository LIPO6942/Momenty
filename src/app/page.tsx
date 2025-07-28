"use client";

import { Plus, Bell, Calendar, CheckCircle, Mic, MapPin, Smile, Image as ImageIcon, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const dailyEvents: { title: string; time: string; color: string; icon: React.ReactNode, description: string }[] = [
  {
    title: "Réunion de projet",
    time: "9:05",
    color: "bg-purple-200/50",
    icon: <BookText className="h-5 w-5 text-purple-700" />,
    description: "Discussion sur les nouvelles fonctionnalités."
  },
  {
    title: "Pause café",
    time: "10:30",
    color: "bg-accent",
    icon: <ImageIcon className="h-5 w-5 text-accent-foreground" />,
    description: "Photo du latte art."
  },
  {
    title: "Déjeuner chez 'Le Zeyer'",
    time: "12:15",
    color: "bg-blue-200/50",
    icon: <MapPin className="h-5 w-5 text-blue-700" />,
    description: "Avec l'équipe marketing."
  },
  {
    title: "Sentiment de la journée",
    time: "15:00",
    color: "bg-green-200/50",
    icon: <Smile className="h-5 w-5 text-green-700" />,
    description: "Plutôt productif et content."
  }
];


export default function TimelinePage() {
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
        
        {dailyEvents.map((event, index) => (
          <Card key={index} className={`rounded-2xl ${event.color}`}>
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-background/60">
                    {event.icon}
                </div>
                <div className="flex-grow">
                    <p className="font-bold">{event.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span>{event.time}</span>
                        <span>•</span>
                        <span>{event.description}</span>
                    </div>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
