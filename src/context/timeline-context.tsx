"use client";

import { createContext, useState, ReactNode } from 'react';
import type { TimelineEvent } from '@/lib/types';
import { BookText, ImageIcon, MapPin, Mic, Smile } from "lucide-react";

interface TimelineContextType {
    events: TimelineEvent[];
    addEvent: (event: Omit<TimelineEvent, 'id'>) => void;
    updateEvent: (id: string, updatedEvent: Partial<Omit<TimelineEvent, 'id'>>) => void;
    deleteEvent: (id: string) => void;
}

const initialEvents: TimelineEvent[] = [
    {
      id: "1",
      title: "Réunion de projet",
      date: new Date(new Date().setHours(9, 36)).toISOString(),
      color: "bg-purple-400",
      icon: <BookText className="h-4 w-4 text-purple-700" />,
      description: "Discussion sur les nouvelles fonctionnalités."
    },
    {
      id: "2",
      title: "Pause café",
      date: new Date(new Date().setHours(10, 52)).toISOString(),
      color: "bg-yellow-400",
      icon: <ImageIcon className="h-4 w-4 text-yellow-700" />,
      description: "Photo du latte art."
    },
    {
      id: "3",
      title: "Déjeuner chez 'Le Zeyer'",
      date: new Date(new Date().setHours(12, 15)).toISOString(),
      color: "bg-blue-400",
      icon: <MapPin className="h-4 w-4 text-blue-700" />,
      description: "Avec l'équipe marketing."
    },
    {
      id: "4",
      title: "Sentiment de la journée",
      date: new Date(new Date().setHours(15, 0)).toISOString(),
      color: "bg-green-400",
      icon: <Smile className="h-4 w-4 text-green-700" />,
      description: "Plutôt productif et content."
    },
    {
      id: "5",
      title: "Note vocale",
      date: new Date(new Date().setHours(16, 45)).toISOString(),
      color: "bg-orange-400",
      icon: <Mic className="h-4 w-4 text-orange-700" />,
      description: "Rappel : le garagiste s'appelle Ahmed."
    },
    {
      id: "6",
      title: "Fin de journée",
      date: new Date(new Date().setHours(18, 5)).toISOString(),
      color: "bg-purple-400",
      icon: <BookText className="h-4 w-4 text-purple-700" />,
      description: "Terminer le rapport pour demain."
    }
  ];
  

export const TimelineContext = createContext<TimelineContextType>({
    events: [],
    addEvent: () => {},
    updateEvent: () => {},
    deleteEvent: () => {},
});

interface TimelineProviderProps {
    children: ReactNode;
}

export const TimelineProvider = ({ children }: TimelineProviderProps) => {
    const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);

    const addEvent = (event: Omit<TimelineEvent, 'id'>) => {
        const newEvent = { ...event, id: new Date().toISOString() + Math.random() };
        setEvents(prevEvents => [...prevEvents, newEvent]);
    };

    const updateEvent = (id: string, updatedEventData: Partial<Omit<TimelineEvent, 'id'>>) => {
        setEvents(prevEvents => prevEvents.map(event =>
            event.id === id ? { ...event, ...updatedEventData } : event
        ));
    }

    const deleteEvent = (id: string) => {
        setEvents(prevEvents => prevEvents.filter(event => event.id !== id));
    }

    return (
        <TimelineContext.Provider value={{ events, addEvent, updateEvent, deleteEvent }}>
            {children}
        </TimelineContext.Provider>
    )
}
