"use client";

import { createContext, useState, ReactNode, useMemo } from 'react';
import type { Instant } from '@/lib/types';
import { BookText, ImageIcon, MapPin, Mic, Smile } from "lucide-react";
import { format, startOfDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface GroupedInstants {
    [key: string]: {
        title: string;
        instants: Instant[];
    };
}

interface TimelineContextType {
    instants: Instant[];
    groupedInstants: GroupedInstants;
    addInstant: (instant: Omit<Instant, 'id'>) => void;
    updateInstant: (id: string, updatedInstant: Partial<Omit<Instant, 'id'>>) => void;
    deleteInstant: (id: string) => void;
}

const initialInstants: Instant[] = [
    {
      id: "1",
      type: 'note',
      title: "Arrivée à Tozeur",
      description: "Le début de l'aventure dans le désert. La chaleur est intense mais l'ambiance est magique.",
      date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
      icon: <BookText className="h-4 w-4 text-purple-700" />,
      color: "bg-purple-400",
      location: "Tozeur, Tunisie",
      emotion: "Excité"
    },
    {
      id: "2",
      type: 'photo',
      title: "Oasis de Chébika",
      description: "Une source d'eau fraîche au milieu de nulle part. Contraste saisissant.",
      date: new Date(new Date(new Date().setDate(new Date().getDate() - 2)).setHours(14, 30)).toISOString(),
      icon: <ImageIcon className="h-4 w-4 text-blue-700" />,
      color: "bg-blue-400",
      location: "Chébika, Tunisie",
      emotion: "Émerveillé"
    },
    {
      id: "3",
      type: 'note',
      title: "Dîner sous les étoiles",
      description: "Un couscous local délicieux, partagé avec des nomades. Le ciel est incroyablement pur.",
      date: new Date(new Date(new Date().setDate(new Date().getDate() - 2)).setHours(20, 0)).toISOString(),
      icon: <BookText className="h-4 w-4 text-purple-700" />,
      color: "bg-purple-400",
      location: "Campement près de Tozeur",
      emotion: "Heureux"
    },
    {
      id: "4",
      type: 'note',
      title: "Exploration de la médina",
      description: "Perdu dans les ruelles de Tunis. Chaque coin de rue est une découverte.",
      date: new Date().toISOString(),
      icon: <BookText className="h-4 w-4 text-purple-700" />,
      color: "bg-purple-400",
      location: "Tunis, Tunisie",
      emotion: "Curieux"
    },
    {
      id: "5",
      type: 'mood',
      title: "Sentiment de la journée",
      description: "Journée de transition, un peu fatigué mais content.",
      date: new Date(new Date().setHours(18, 0)).toISOString(),
      color: "bg-green-400",
      icon: <Smile className="h-4 w-4 text-green-700" />,
      location: "Tunis, Tunisie",
      emotion: "Bien"
    }
  ];
  

export const TimelineContext = createContext<TimelineContextType>({
    instants: [],
    groupedInstants: {},
    addInstant: () => {},
    updateInstant: () => {},
    deleteInstant: () => {},
});

interface TimelineProviderProps {
    children: ReactNode;
}

export const TimelineProvider = ({ children }: TimelineProviderProps) => {
    const [instants, setInstants] = useState<Instant[]>(initialInstants);

    const addInstant = (instant: Omit<Instant, 'id'>) => {
        const newInstant = { ...instant, id: new Date().toISOString() + Math.random() };
        setInstants(prevInstants => [...prevInstants, newInstant].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    const updateInstant = (id: string, updatedInstantData: Partial<Omit<Instant, 'id'>>) => {
        setInstants(prevInstants => prevInstants.map(instant =>
            instant.id === id ? { ...instant, ...updatedInstantData } : instant
        ));
    }

    const deleteInstant = (id: string) => {
        setInstants(prevInstants => prevInstants.filter(instant => instant.id !== id));
    }

    const groupedInstants = useMemo(() => {
      const groups: GroupedInstants = {};
      const sortedInstants = [...instants].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      sortedInstants.forEach(instant => {
          const dayKey = format(startOfDay(parseISO(instant.date)), 'yyyy-MM-dd');
          if (!groups[dayKey]) {
              const dayIndex = Object.keys(groups).length + 1;
              groups[dayKey] = {
                  title: `Jour ${dayIndex} - ${format(parseISO(instant.date), 'd MMMM yyyy', { locale: fr })}`,
                  instants: []
              };
          }
          groups[dayKey].instants.push(instant);
      });

      // Reverse order of instants within each group
      Object.values(groups).forEach(group => {
          group.instants.reverse();
      });

      // Reverse order of days
      return Object.fromEntries(Object.entries(groups).reverse());

    }, [instants]);

    return (
        <TimelineContext.Provider value={{ instants, groupedInstants, addInstant, updateInstant, deleteInstant }}>
            {children}
        </TimelineContext.Provider>
    )
}
