
"use client";

import React, { createContext, useState, useMemo, useEffect, useCallback } from 'react';
import type { Instant, Trip, Encounter, Dish } from '@/lib/types';
import { BookText, Utensils, Camera, Palette, ShoppingBag, Landmark, Mountain, Heart, Plane, Car, Train, Bus, Ship, Anchor, Leaf } from "lucide-react";
import { format, startOfDay, parseISO, isToday, isYesterday, formatRelative } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getImage, getInstants, saveInstant, deleteInstantFromDB, saveImage, getEncounters, deleteEncounter as deleteEncounterFromDB, saveEncounter, getDishes, saveDish, deleteDish as deleteDishFromDB } from '@/lib/idb';
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
    deleteInstantsByLocation: (locationName: string) => void;
    activeTrip: Trip | null;
    activeStay: Trip | null; // Using Trip type for Stay as well
    encounters: Encounter[];
    addEncounter: (encounter: Omit<Encounter, 'id'>) => void;
    deleteEncounter: (id: string) => void;
    dishes: Dish[];
    addDish: (dish: Omit<Dish, 'id'>) => void;
    deleteDish: (id: string) => void;
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
    deleteInstantsByLocation: () => {},
    activeTrip: null,
    activeStay: null,
    encounters: [],
    addEncounter: () => {},
    deleteEncounter: () => {},
    dishes: [],
    addDish: () => {},
    deleteDish: () => {},
});

interface TimelineProviderProps {
    children: React.ReactNode;
}

export const TimelineProvider = ({ children }: TimelineProviderProps) => {
    const [instants, setInstants] = useState<Instant[]>([]);
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
    const [activeStay, setActiveStay] = useState<Trip | null>(null);

    const getFullPhotoData = useCallback(async <T extends { id: string, photo?: string | null }>(item: T): Promise<T> => {
        let finalPhoto = item.photo;
        const photoKey = item.photo; 
        if (photoKey && (photoKey.startsWith('local_') || photoKey.startsWith('encounter_') || photoKey.startsWith('dish_'))) {
            const localPhoto = await getImage(photoKey);
            finalPhoto = localPhoto; 
        }
        return { ...item, photo: finalPhoto };
    }, []);

    useEffect(() => {
        const loadData = async () => {
          let loadedInstants = await getInstants();
          let loadedEncounters = await getEncounters();
          let loadedDishes = await getDishes();
          
          const processedInstants = await Promise.all(
            loadedInstants.map(async (inst) => {
              const instWithPhotoData = await getFullPhotoData(inst);
              const { icon, color } = getCategoryAttributes(inst.category);
              return { ...instWithPhotoData, icon, color };
            })
          );
          
          const processedEncounters = await Promise.all(loadedEncounters.map(e => getFullPhotoData(e)));
          const processedDishes = await Promise.all(loadedDishes.map(d => getFullPhotoData(d)));

          setInstants(processedInstants.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          setEncounters(processedEncounters.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          setDishes(processedDishes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        };
        loadData();

        const handleStorageChange = () => {
            const savedTrip = localStorage.getItem('activeTrip');
            setActiveTrip(savedTrip ? JSON.parse(savedTrip) : null);
            const savedStay = localStorage.getItem('activeStay');
            setActiveStay(savedStay ? JSON.parse(savedStay) : null);
        };
        
        handleStorageChange(); // Initial load
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        }
      }, [getFullPhotoData]);

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
        
        const instantWithContext = { ...instantData };

        const newInstantForDb: Omit<Instant, 'icon' | 'color'> = {
            id: newInstantId,
            type: instantWithContext.type,
            title: instantWithContext.title,
            description: instantWithContext.description,
            date: instantWithContext.date,
            location: instantWithContext.location,
            emotion: instantWithContext.emotion,
            photo: null,
            category: category,
        };
        
        if (instantWithContext.photo) {
            await saveImage(`local_${newInstantId}`, instantWithContext.photo);
            newInstantForDb.photo = `local_${newInstantId}`;
        }
        
        await saveInstant(newInstantForDb as Instant);
        
        const newInstantForState = addRuntimeAttributes({
            ...newInstantForDb,
            photo: instantData.photo
        } as Instant);

        setInstants(prevInstants => [...prevInstants, newInstantForState].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    const addEncounter = async (encounterData: Omit<Encounter, 'id'>) => {
        const newEncounterId = new Date().toISOString() + Math.random();
        const encounterForDb = { id: newEncounterId, ...encounterData, photo: null };
        const encounterForState = { id: newEncounterId, ...encounterData };

        if (encounterData.photo) {
            const photoId = `encounter_${newEncounterId}`;
            await saveImage(photoId, encounterData.photo);
            encounterForDb.photo = photoId;
        }

        await saveEncounter(encounterForDb as Encounter);
        
        setEncounters(prev => [encounterForState, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }

    const addDish = async (dishData: Omit<Dish, 'id'>) => {
        const newDishId = new Date().toISOString() + Math.random();
        const dishForDb = { id: newDishId, ...dishData, photo: null };
        const dishForState = { id: newDishId, ...dishData };

        if (dishData.photo) {
            const photoId = `dish_${newDishId}`;
            await saveImage(photoId, dishData.photo);
            dishForDb.photo = photoId;
        }

        await saveDish(dishForDb as Dish);
        
        setDishes(prev => [dishForState, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }


    const updateInstant = async (id: string, updatedInstantData: Partial<Omit<Instant, 'id'>>) => {
        
        const originalInstant = instants.find(inst => inst.id === id);
        if (!originalInstant) return;

        let updatedInstant = { ...originalInstant, ...updatedInstantData };
        
        if(updatedInstant.photo && updatedInstant.photo !== originalInstant.photo && updatedInstant.photo.startsWith('data:')) {
            await saveImage(`local_${id}`, updatedInstant.photo);
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
        await saveImage(`local_${id}`, ''); 
        setInstants(prevInstants => prevInstants.filter(instant => instant.id !== id));
    }

    const deleteEncounter = async (id: string) => {
        await deleteEncounterFromDB(id);
        setEncounters(prev => prev.filter(encounter => encounter.id !== id));
    }
    
    const deleteDish = async (id: string) => {
        await deleteDishFromDB(id);
        setDishes(prev => prev.filter(dish => dish.id !== id));
    }

    const deleteInstantsByLocation = async (locationName: string) => {
        const instantsToDelete = instants.filter(i => i.location === locationName);
        for (const instant of instantsToDelete) {
            await deleteInstantFromDB(instant.id);
            await saveImage(`local_${instant.id}`, '');
        }
        setInstants(prev => prev.filter(i => i.location !== locationName));
    };

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
              title: `Jour ${dayIndex} (${format(dayDate, 'd MMMM yyyy', { locale: fr })})`,
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
        <TimelineContext.Provider value={{ instants, groupedInstants, addInstant, updateInstant, deleteInstant, deleteInstantsByLocation, activeTrip, activeStay, encounters, addEncounter, deleteEncounter, dishes, addDish, deleteDish }}>
            {children}
        </TimelineContext.Provider>
    )
}
