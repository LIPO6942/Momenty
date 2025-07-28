"use client";

import { useState } from "react";
import type { Habit } from "@/lib/types";
import { iconMap } from "@/lib/icons";
import { Plus, Bell, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const upcomingActivities: { title: string; time: string; color: string; icon: React.ReactNode, user: { name: string, image?: string } }[] = [
  {
    title: "Envoyer un rappel de paiement",
    time: "à 9h",
    color: "bg-purple-200/50",
    icon: <Bell className="h-5 w-5 text-purple-700" />,
    user: { name: "Jessi Johnson", image: "https://i.pravatar.cc/40?u=jessi" }
  },
  {
    title: "Appeler pour le contrat",
    time: "à 9h",
    color: "bg-accent",
    icon: <Calendar className="h-5 w-5 text-accent-foreground" />,
    user: { name: "Brian Carpenter", image: "https://i.pravatar.cc/40?u=brian" }
  },
  {
    title: "Valider le design",
    time: "à 11h",
    color: "bg-green-200/50",
    icon: <CheckCircle className="h-5 w-5 text-green-700" />,
    user: { name: "Anna Lee", image: "https://i.pravatar.cc/40?u=anna" }
  }
];


export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Activité</h1>
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
           <Button variant="ghost" size="icon"><Calendar className="h-5 w-5" /></Button>
        </div>
      </div>
      
       <div className="flex items-center gap-4 mb-8 p-4 bg-card rounded-xl shadow-sm">
         <Button className="flex-1" size="lg">
           <Plus className="mr-2" /> Créer
         </Button>
         <Button variant="outline" size="lg">Historique</Button>
         <Button variant="outline" size="lg">Rappels</Button>
         <Button variant="outline" size="lg">Messages</Button>
      </div>


      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">À venir</h2>
            <span className="font-bold text-muted-foreground">{upcomingActivities.length} Activités</span>
        </div>
        
        {upcomingActivities.map((activity, index) => (
          <Card key={index} className={`rounded-2xl ${activity.color}`}>
            <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-full bg-background/60">
                    {activity.icon}
                </div>
                <div className="flex-grow">
                    <p className="font-bold">{activity.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Avatar className="h-5 w-5">
                            <AvatarImage src={activity.user.image} alt={activity.user.name} />
                            <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span>{activity.user.name}</span>
                        <span>•</span>
                        <span>{activity.time}</span>
                    </div>
                </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
