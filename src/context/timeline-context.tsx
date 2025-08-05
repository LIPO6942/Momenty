
"use client";

import React, { createContext, useState, useMemo, useEffect } from 'react';
import type { Instant } from '@/lib/types';
import { BookText, Utensils, Camera, Palette, ShoppingBag, Landmark, Mountain, Heart, Plane, Car, Train, Bus, Ship, Anchor, Leaf } from "lucide-react";
import { format, startOfDay, parseISO, isToday, isYesterday, formatRelative } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getImage, getInstants, saveInstant, deleteInstantFromDB, saveImage } from '@/lib/idb';
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
    addInstant: (instant: Omit<Instant, 'id' | 'color' | 'icon'>) => void;
    updateInstant: (id: string, updatedInstant: Partial<Omit<Instant, 'id'>>) => void;
    deleteInstant: (id: string) => void;
}

const getCategoryAttributes = (category?: string) => {
    switch (category) {
        case 'Gastronomie': return { icon: <Utensils />, color: 'bg-orange-600' };
        case 'Culture': return { icon: <Landmark />, color: 'bg-purple-700' };
        case 'Nature': return { icon: <Leaf />, color: 'bg-green-600' };
        case 'Shopping': return { icon: <ShoppingBag />, color: 'bg-pink-600' };
        case 'Art': return { icon: <Palette />, color: 'bg-red-600' };
        case 'Détente': return { icon: <Heart />, color: 'bg-teal-600' };
        case 'Voyage': return { icon: <Plane />, color: 'bg-sky-600' };
        case 'Sport': return { icon: <Anchor />, color: 'bg-indigo-600' };
        default: return { icon: <BookText />, color: 'bg-gray-600' };
    }
};

const initialInstants: Omit<Instant, 'id'>[] = [
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

const addRuntimeAttributes = (instant: Omit<Instant, 'icon' | 'color'>): Instant => {
    const { icon, color } = getCategoryAttributes(instant.category);
    return { ...instant, icon, color };
};

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
        const loadData = async () => {
          let loadedInstants = await getInstants();
          if (loadedInstants.length === 0) {
            // First time load, populate with initial data and save
            const instantsToSave = initialInstants.map((inst, index) => ({
              ...inst,
              id: `initial-${index}-${new Date(inst.date).getTime()}`
            }));
            for (const inst of instantsToSave) {
              await saveInstant(inst as Instant);
            }
            loadedInstants = await getInstants();
          }
    
          // Add icons and colors, and resolve local images
          const processedInstants = await Promise.all(
            loadedInstants.map(async (inst) => {
              let photoUrl = inst.photo;
              if (inst.photo && inst.photo === 'local') {
                  // It's a local photo stored by reference (ID)
                  const localPhoto = await getImage(inst.id);
                  photoUrl = localPhoto || 'https://placehold.co/500x300.png'; // Fallback
              }
              return addRuntimeAttributes({...inst, photo: photoUrl});
            })
          );
          setInstants(processedInstants.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        };
        loadData();
      }, []);

    const addInstant = async (instant: Omit<Instant, 'id' | 'color' | 'icon'>) => {
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

        const newInstantId = new Date().toISOString() + Math.random();
        
        let newInstantForDb = {
            ...instant,
            id: newInstantId,
            category,
        };
        
        if (instant.photo) {
            await saveImage(newInstantId, instant.photo);
            // Don't store the large data URL in the main instant object, just a marker
            newInstantForDb.photo = 'local';
        }
        
        await saveInstant(newInstantForDb);
        
        const newInstantForState = addRuntimeAttributes({
            ...newInstantForDb,
            photo: instant.photo // Keep the data URL for immediate display in the UI
        });

        setInstants(prevInstants => [...prevInstants, newInstantForState].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    const updateInstant = async (id: string, updatedInstantData: Partial<Omit<Instant, 'id'>>) => {
        
        const originalInstant = instants.find(inst => inst.id === id);
        if (!originalInstant) return;

        let updatedInstant = { ...originalInstant, ...updatedInstantData };
        
        // Handle photo saving and prevent storing data URL in DB
        if(updatedInstant.photo && updatedInstant.photo !== originalInstant.photo) {
            if (updatedInstant.photo.startsWith('data:')) {
                 await saveImage(id, updatedInstant.photo);
            }
        }

        // Recategorize if title or description changed
        if (updatedInstant.title !== originalInstant.title || updatedInstant.description !== originalInstant.description) {
            try {
                const { category } = await categorizeInstant({
                    title: updatedInstant.title,
                    description: updatedInstant.description,
                });
                updatedInstant.category = category;
            } catch (error) {
                 console.error("AI categorization failed on update", error);
            }
        }
        
        const updatedInstantForDb: Omit<Instant, 'icon'|'color'> = {
            id: updatedInstant.id,
            type: updatedInstant.type,
            title: updatedInstant.title,
            description: updatedInstant.description,
            date: updatedInstant.date,
            location: updatedInstant.location,
            emotion: updatedInstant.emotion,
            photo: updatedInstant.photo ? 'local' : null,
            category: updatedInstant.category
        };

        await saveInstant(updatedInstantForDb);
        
        const updatedInstantForState = addRuntimeAttributes({
            ...updatedInstantForDb,
            photo: updatedInstant.photo // Keep the full data URL for the UI state
        });

        setInstants(prevInstants => prevInstants.map(instant =>
            instant.id === id ? updatedInstantForState : instant
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }

    const deleteInstant = async (id: string) => {
        await deleteInstantFromDB(id);
        // Also delete the associated image if it exists
        await saveImage(id, ''); // Overwrite with empty to "delete"
        setInstants(prevInstants => prevInstants.filter(instant => instant.id !== id));
    }

    const groupedInstants = useMemo(() => {
      if (instants.length === 0) return {};
      
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
