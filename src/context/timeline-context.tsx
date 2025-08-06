
"use client";

import React, { createContext, useState, useMemo, useEffect } from 'react';
import type { Instant, Trip } from '@/lib/types';
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
    addInstant: (instant: Omit<Instant, 'id'>) => void;
    updateInstant: (id: string, updatedInstant: Partial<Omit<Instant, 'id'>>) => void;
    deleteInstant: (id: string) => void;
    activeTrip: Trip | null;
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

const addRuntimeAttributes = (instant: Instant): Instant => {
    const { icon, color } = getCategoryAttributes(instant.category);
    return { ...instant, icon, color };
};

export const TimelineContext = createContext<TimelineContextType>({
    instants: [],
    groupedInstants: {},
    addInstant: () => {},
    updateInstant: () => {},
    deleteInstant: () => {},
    activeTrip: null,
});

interface TimelineProviderProps {
    children: React.ReactNode;
}

export const TimelineProvider = ({ children }: TimelineProviderProps) => {
    const [instants, setInstants] = useState<Instant[]>([]);
    const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

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
              let finalPhoto = inst.photo;
              if (inst.photo && inst.photo.startsWith('local_')) {
                  const localPhoto = await getImage(inst.id);
                  finalPhoto = localPhoto; 
              }
              const { icon, color } = getCategoryAttributes(inst.category);
              return { ...inst, photo: finalPhoto, icon, color };
            })
          );
          setInstants(processedInstants.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        };
        loadData();

        const handleStorageChange = () => {
            const savedTrip = localStorage.getItem('activeTrip');
            setActiveTrip(savedTrip ? JSON.parse(savedTrip) : null);
        };
        
        handleStorageChange(); // Initial load
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        }
      }, []);

    const addInstant = async (instantData: Omit<Instant, 'id'>) => {
        let category = 'Note';
        try {
            const result = await categorizeInstant({
                title: instantData.title,
                description: instantData.description,
            });
            category = result.category;
        } catch (error) {
            console.error("AI categorization failed", error);
        }

        const newInstantId = new Date().toISOString() + Math.random();
        
        let instantWithContext = { ...instantData };
        if (activeTrip && !instantWithContext.location) {
            instantWithContext.location = activeTrip.location;
        }

        // Object to be saved in DB - must be clean of complex objects
        const newInstantForDb: Instant = {
            id: newInstantId,
            type: instantWithContext.type,
            title: instantWithContext.title,
            description: instantWithContext.description,
            date: instantWithContext.date,
            location: instantWithContext.location,
            emotion: instantWithContext.emotion,
            photo: null, // Will be set to a reference string if photo exists
            category: category,
        };
        
        if (instantWithContext.photo) {
            await saveImage(newInstantId, instantWithContext.photo);
            newInstantForDb.photo = `local_${newInstantId}`; // Set the reference
        }
        
        await saveInstant(newInstantForDb);
        
        // Object for the state - includes the actual photo data for immediate display
        const newInstantForState = addRuntimeAttributes({
            ...newInstantForDb,
            photo: instantData.photo // Use the full data URI for the state
        });

        setInstants(prevInstants => [...prevInstants, newInstantForState].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    const updateInstant = async (id: string, updatedInstantData: Partial<Omit<Instant, 'id'>>) => {
        
        const originalInstant = instants.find(inst => inst.id === id);
        if (!originalInstant) return;

        let updatedInstant = { ...originalInstant, ...updatedInstantData };
        
        // Handle photo saving separately
        if(updatedInstant.photo && updatedInstant.photo !== originalInstant.photo && updatedInstant.photo.startsWith('data:')) {
            await saveImage(id, updatedInstant.photo);
        }

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
        
        const updatedInstantForDb: Instant = {
            id: updatedInstant.id,
            type: updatedInstant.type,
            title: updatedInstant.title,
            description: updatedInstant.description,
            date: updatedInstant.date,
            location: updatedInstant.location,
            emotion: updatedInstant.emotion,
            photo: updatedInstant.photo ? `local_${id}` : null,
            category: updatedInstant.category
        };

        await saveInstant(updatedInstantForDb);
        
        const updatedInstantForState = addRuntimeAttributes({
            ...updatedInstantForDb,
            photo: updatedInstant.photo
        });

        setInstants(prevInstants => prevInstants.map(instant =>
            instant.id === id ? updatedInstantForState : instant
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }

    const deleteInstant = async (id: string) => {
        await deleteInstantFromDB(id);
        await saveImage(id, ''); 
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
        <TimelineContext.Provider value={{ instants, groupedInstants, addInstant, updateInstant, deleteInstant, activeTrip }}>
            {children}
        </TimelineContext.Provider>
    )
}
