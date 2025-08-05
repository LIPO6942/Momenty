
"use client";

import React, { createContext, useState, useMemo, useEffect } from 'react';
import type { Instant } from '@/lib/types';
import { BookText, Utensils, Camera, Palette, ShoppingBag, Landmark, Mountain, Heart, Plane, Car, Train, Bus, Ship, Anchor, Leaf } from "lucide-react";
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

const getCategoryAttributes = (category?: string) => {
    switch (category) {
        case 'Gastronomie': return { icon: <Utensils />, color: 'bg-orange-500' };
        case 'Culture': return { icon: <Landmark />, color: 'bg-purple-600' };
        case 'Nature': return { icon: <Leaf />, color: 'bg-green-500' };
        case 'Shopping': return { icon: <ShoppingBag />, color: 'bg-pink-500' };
        case 'Art': return { icon: <Palette />, color: 'bg-red-500' };
        case 'Détente': return { icon: <Heart />, color: 'bg-teal-500' };
        case 'Voyage': return { icon: <Plane />, color: 'bg-sky-500' };
        case 'Sport': return { icon: <Anchor />, color: 'bg-indigo-500' };
        default: return { icon: <BookText />, color: 'bg-gray-500' };
    }
};

const initialInstants: Omit<Instant, 'id' | 'icon' | 'color'>[] = [
    {
      type: 'note',
      title: "Arrivée à Tozeur",
      description: "Le début de l'aventure dans le désert. La chaleur est intense mais l'ambiance est magique.",
      date: "2024-07-20T10:00:00.000Z",
      location: "Tozeur, Tunisie",
      emotion: "Excité",
      category: "Voyage",
    },
    {
      type: 'photo',
      title: "Oasis de Chébika",
      description: "Une source d'eau fraîche au milieu de nulle part. Contraste saisissant.",
      date: "2024-07-20T14:30:00.000Z",
      location: "Chébika, Tunisie",
      emotion: "Émerveillé",
      photo: "https://placehold.co/500x300.png",
      category: "Nature",
    },
    {
      type: 'note',
      title: "Dîner sous les étoiles",
      description: "Un couscous local délicieux, partagé avec des nomades. Le ciel est incroyablement pur.",
      date: "2024-07-20T20:00:00.000Z",
      location: "Campement près de Tozeur",
      emotion: "Heureux",
      category: "Gastronomie",
    },
    {
      type: 'note',
      title: "Exploration de la médina",
      description: "Perdu dans les ruelles de Tunis. Chaque coin de rue est une découverte.",
      date: "2024-07-22T11:00:00.000Z",
      location: "Tunis, Tunisie",
      emotion: "Curieux",
      category: "Culture",
    },
    {
      type: 'mood',
      title: "Sentiment de la journée",
      description: "Journée de transition, un peu fatigué mais content.",
      date: "2024-07-22T18:00:00.000Z",
      location: "Tunis, Tunisie",
      emotion: "Bien",
      category: "Détente"
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
          const instantsWithIdsAndAttrs = initialInstants.map((inst, index) => {
            const { icon, color } = getCategoryAttributes(inst.category);
            return {
              ...inst,
              id: `initial-${index}-${new Date(inst.date).getTime()}`,
              icon,
              color,
            }
          });
    
          const loadedInstants = await Promise.all(
            instantsWithIdsAndAttrs.map(async (inst) => {
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

    const addInstant = async (instant: Omit<Instant, 'id' | 'icon' | 'color'>) => {
        let category = 'Note';
        try {
            const result = await categorizeInstant({
                title: instant.title,
                description: instant.description,
            });
            category = result.category;
        } catch (error) {
            console.error("AI categorization failed", error);
        }

        const { icon, color } = getCategoryAttributes(category);

        const newInstantWithId = { 
            ...instant, 
            id: new Date().toISOString() + Math.random(),
            category,
            icon,
            color
        };

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

                const { icon, color } = getCategoryAttributes(category);
                
                setInstants(prevInstants => prevInstants.map(instant =>
                    instant.id === id ? { ...instant, category, icon, color } : instant
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
