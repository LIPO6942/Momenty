"use client";

import { createContext, useState, ReactNode } from 'react';
import type { TimelineEvent } from '@/lib/types';
import { BookText, ImageIcon, MapPin, Smile } from "lucide-react";

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
      date: new Date(new Date().setHours(9, 5)).toISOString(),
      color: "bg-purple-200/50",
      icon: <BookText className="h-5 w-5 text-purple-700" />,
      description: "Discussion sur les nouvelles fonctionnalités."
    },
    {
      id: "2",
      title: "Pause café",
      date: new Date(new Date().setHours(10, 30)).toISOString(),
      color: "bg-accent",
      icon: <ImageIcon className="h-5 w-5 text-accent-foreground" />,
      description: "Photo du latte art."
    },
    {
      id: "3",
      title: "Déjeuner chez 'Le Zeyer'",
      date: new Date(new Date().setHours(12, 15)).toISOString(),
      color: "bg-blue-200/50",
      icon: <MapPin className="h-5 w-5 text-blue-700" />,
      description: "Avec l'équipe marketing."
    },
    {
      id: "4",
      title: "Sentiment de la journée",
      date: new Date(new Date().setHours(15, 0)).toISOString(),
      color: "bg-green-200/50",
      icon: <Smile className="h-5 w-5 text-green-700" />,
      description: "Plutôt productif et content."
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
