
"use client";

import React, { createContext, useState, useMemo, useEffect } from 'react';
import type { Instant } from '@/lib/types';
import { BookText, ImageIcon, MapPin, Mic, Smile } from "lucide-react";
import { format, startOfDay, parseISO, isToday, isYesterday, formatRelative } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getImage } from '@/lib/idb';
import { categorizeInstant } from '@/ai/flows/categorize-instant-flow';

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

const initialInstants: Omit<Instant, 'id'>[] = [
    {
      type: 'note',
      title: "Arrivée à Tozeur",
      description: "Le début de l'aventure dans le désert. La chaleur est intense mais l'ambiance est magique.",
      date: "2024-07-20T10:00:00.000Z",
      icon: <BookText className="h-4 w-4 text-white" />,
      color: "bg-purple-500",
      location: "Tozeur, Tunisie",
      emotion: "Excité"
    },
    {
      type: 'note',
      title: "Oasis de Chébika",
      description: "Une source d'eau fraîche au milieu de nulle part. Contraste saisissant.",
      date: "2024-07-20T14:30:00.000Z",
      icon: <ImageIcon className="h-4 w-4 text-white" />,
      color: "bg-blue-500",
      location: "Chébika, Tunisie",
      emotion: "Émerveillé",
      photo: "https://placehold.co/500x300.png"
    },
    {
      type: 'note',
      title: "Dîner sous les étoiles",
      description: "Un couscous local délicieux, partagé avec des nomades. Le ciel est incroyablement pur.",
      date: "2024-07-20T20:00:00.000Z",
      icon: <BookText className="h-4 w-4 text-white" />,
      color: "bg-purple-500",
      location: "Campement près de Tozeur",
      emotion: "Heureux"
    },
    {
      type: 'note',
      title: "Exploration de la médina",
      description: "Perdu dans les ruelles de Tunis. Chaque coin de rue est une découverte.",
      date: "2024-07-22T11:00:00.000Z",
      icon: <BookText className="h-4 w-4 text-white" />,
      color: "bg-purple-500",
      location: "Tunis, Tunisie",
      emotion: "Curieux"
    },
    {
      type: 'mood',
      title: "Sentiment de la journée",
      description: "Journée de transition, un peu fatigué mais content.",
      date: "2024-07-22T18:00:00.000Z",
      color: "bg-green-500",
      icon: <Smile className="h-4 w-4 text-white" />,
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
    children: React.ReactNode;
}

export const TimelineProvider = ({ children }: TimelineProviderProps) => {
    const [instants, setInstants] = useState<Instant[]>([]);

    useEffect(() => {
        const loadInstants = async () => {
          // Initialize with IDs and load photos from IndexedDB
          const instantsWithIds = initialInstants.map((inst, index) => ({
            ...inst,
            id: `initial-${index}-${new Date(inst.date).getTime()}`,
          }));
    
          const loadedInstants = await Promise.all(
            instantsWithIds.map(async (inst) => {
              // Don't overwrite placeholder photos with empty local data
              if (inst.photo && inst.photo.startsWith('https://')) {
                return inst;
              }
              const localPhoto = await getImage(inst.id);
              return { ...inst, photo: localPhoto || inst.photo };
            })
          );
          setInstants(loadedInstants.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        };
        loadInstants();
      }, []);

    const addInstant = async (instant: Omit<Instant, 'id'>) => {
        const newInstantWithId = { ...instant, id: new Date().toISOString() + Math.random() };
        
        try {
            const { category } = await categorizeInstant({
                title: newInstantWithId.title,
                description: newInstantWithId.description,
            });
            newInstantWithId.category = category;
        } catch (error) {
            console.error("AI categorization failed", error);
        }

        setInstants(prevInstants => [...prevInstants, newInstantWithId].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    const updateInstant = async (id: string, updatedInstantData: Partial<Omit<Instant, 'id'>>) => {
        let fullUpdatedInstant: Instant | undefined;

        setInstants(prevInstants => {
            const newInstants = prevInstants.map(instant => {
                if (instant.id === id) {
                    fullUpdatedInstant = { ...instant, ...updatedInstantData };
                    return fullUpdatedInstant;
                }
                return instant;
            });
            return newInstants;
        });

        if (fullUpdatedInstant) {
            try {
                const { category } = await categorizeInstant({
                    title: fullUpdatedInstant.title,
                    description: fullUpdatedInstant.description,
                });
                
                // Final update with category
                setInstants(prevInstants => prevInstants.map(instant =>
                    instant.id === id ? { ...instant, category: category } : instant
                ));

            } catch (error) {
                 console.error("AI categorization failed on update", error);
            }
        }
    }

    const deleteInstant = (id: string) => {
        setInstants(prevInstants => prevInstants.filter(instant => instant.id !== id));
    }

    const groupedInstants = useMemo(() => {
      const sortedDayKeys = [...new Set(instants.map(i => format(startOfDay(parseISO(i.date)), 'yyyy-MM-dd')))]
          .sort((a,b) => new Date(b).getTime() - new Date(a).getTime());

      const groups: GroupedInstants = {};
      
      const reversedDayKeys = [...sortedDayKeys].reverse();

      sortedDayKeys.forEach(dayKey => {
          const dayDate = parseISO(dayKey);
          const dayIndex = reversedDayKeys.indexOf(dayKey) + 1;

          groups[dayKey] = {
              title: `Jour ${dayIndex} - ${format(dayDate, 'd MMMM yyyy', { locale: fr })}`,
              instants: []
          };
      });

      instants.forEach(instant => {
          const dayKey = format(startOfDay(parseISO(instant.date)), 'yyyy-MM-dd');
          if (groups[dayKey]) {
              groups[dayKey].instants.push(instant);
          }
      });
      
      return groups;

    }, [instants]);

    return (
        <TimelineContext.Provider value={{ instants, groupedInstants, addInstant, updateInstant, deleteInstant }}>
            {children}
        </TimelineContext.Provider>
    )
}
