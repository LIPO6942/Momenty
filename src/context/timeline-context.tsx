
"use client";

import { createContext, useState, ReactNode, useMemo } from 'react';
import type { Instant } from '@/lib/types';
import { BookText, ImageIcon, MapPin, Mic, Smile } from "lucide-react";
import { format, startOfDay, parseISO, isToday, isYesterday, formatRelative } from 'date-fns';
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
      date: "2024-07-20T10:00:00.000Z",
      icon: <BookText className="h-4 w-4" />,
      color: "bg-purple-500",
      location: "Tozeur, Tunisie",
      emotion: "Excité"
    },
    {
      id: "2",
      type: 'photo',
      title: "Oasis de Chébika",
      description: "Une source d'eau fraîche au milieu de nulle part. Contraste saisissant.",
      date: "2024-07-20T14:30:00.000Z",
      icon: <ImageIcon className="h-4 w-4" />,
      color: "bg-blue-500",
      location: "Chébika, Tunisie",
      emotion: "Émerveillé"
    },
    {
      id: "3",
      type: 'note',
      title: "Dîner sous les étoiles",
      description: "Un couscous local délicieux, partagé avec des nomades. Le ciel est incroyablement pur.",
      date: "2024-07-20T20:00:00.000Z",
      icon: <BookText className="h-4 w-4" />,
      color: "bg-purple-500",
      location: "Campement près de Tozeur",
      emotion: "Heureux"
    },
    {
      id: "4",
      type: 'note',
      title: "Exploration de la médina",
      description: "Perdu dans les ruelles de Tunis. Chaque coin de rue est une découverte.",
      date: "2024-07-22T11:00:00.000Z",
      icon: <BookText className="h-4 w-4" />,
      color: "bg-purple-500",
      location: "Tunis, Tunisie",
      emotion: "Curieux"
    },
    {
      id: "5",
      type: 'mood',
      title: "Sentiment de la journée",
      description: "Journée de transition, un peu fatigué mais content.",
      date: "2024-07-22T18:00:00.000Z",
      color: "bg-green-500",
      icon: <Smile className="h-4 w-4" />,
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

const formatDateTitle = (date: Date) => {
    if (isToday(date)) return "Aujourd'hui";
    if (isYesterday(date)) return "Hier";
    return format(date, 'EEEE d MMMM yyyy', { locale: fr });
};

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
      // First, create a sorted list of unique day keys (e.g., '2024-07-22')
      const sortedDayKeys = [...new Set(instants.map(i => format(startOfDay(parseISO(i.date)), 'yyyy-MM-dd')))]
          .sort((a,b) => new Date(b).getTime() - new Date(a).getTime());

      // Then, create the groups object based on these sorted keys
      const groups: GroupedInstants = {};
      
      // We need a way to assign 'Jour X' correctly
      const reversedDayKeys = [...sortedDayKeys].reverse();

      sortedDayKeys.forEach(dayKey => {
          const dayDate = parseISO(dayKey);
          const dayIndex = reversedDayKeys.indexOf(dayKey) + 1;

          groups[dayKey] = {
              title: `Jour ${dayIndex} - ${format(dayDate, 'd MMMM yyyy', { locale: fr })}`,
              instants: []
          };
      });

      // Finally, populate the instants into the correct group
      instants.forEach(instant => {
          const dayKey = format(startOfDay(parseISO(instant.date)), 'yyyy-MM-dd');
          if (groups[dayKey]) {
              groups[dayKey].instants.push(instant);
          }
      });
      
      // The instants within each day group are already sorted because the main list is sorted
      return groups;

    }, [instants]);

    return (
        <TimelineContext.Provider value={{ instants, groupedInstants, addInstant, updateInstant, deleteInstant }}>
            {children}
        </TimelineContext.Provider>
    )
}
