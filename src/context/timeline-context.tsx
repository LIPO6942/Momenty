

"use client";

import React, { createContext, useState, useMemo, useEffect, useCallback } from 'react';
import type { Instant, Trip, Encounter, Dish, Accommodation } from '@/lib/types';
import { BookText, Utensils, Camera, Palette, ShoppingBag, Landmark, Mountain, Heart, Plane, Car, Train, Bus, Ship, Anchor, Leaf } from "lucide-react";
import { format, startOfDay, parseISO, isToday, isYesterday, formatRelative } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
    getInstants, saveInstant, deleteInstant as deleteInstantFromDB,
    getEncounters, saveEncounter, deleteEncounter as deleteEncounterFromDB,
    getDishes, saveDish, deleteDish as deleteDishFromDB,
    getAccommodations, saveAccommodation, deleteAccommodation as deleteAccommodationFromDB,
    getStories, saveStory, deleteStory as deleteStoryFromDB,
    getManualLocations, saveManualLocations
} from '@/lib/firestore';
import { categorizeInstant } from '@/ai/flows/categorize-instant-flow';
import { useAuth } from './auth-context';


interface GroupedInstants {
    [key: string]: {
        title: string;
        instants: Instant[];
    };
}

interface TimelineContextType {
    instants: Instant[];
    groupedInstants: GroupedInstants;
    addInstant: (instant: Omit<Instant, 'id' | 'userId'>) => void;
    updateInstant: (id: string, updatedInstant: Partial<Omit<Instant, 'id' | 'userId'>>) => void;
    deleteInstant: (id: string) => void;
    deleteInstantsByLocation: (locationName: string) => void;
    activeTrip: Trip | null;
    activeStay: Trip | null; // Using Trip type for Stay as well
    encounters: Encounter[];
    addEncounter: (encounter: Omit<Encounter, 'id'| 'userId'>) => void;
    updateEncounter: (id: string, updatedData: Partial<Omit<Encounter, 'id' | 'userId'>>) => Promise<void>;
    deleteEncounter: (id: string) => void;
    dishes: Dish[];
    addDish: (dish: Omit<Dish, 'id'| 'userId'>) => void;
    updateDish: (id: string, updatedData: Partial<Omit<Dish, 'id' | 'userId'>>) => Promise<void>;
    deleteDish: (id: string) => void;
    accommodations: Accommodation[];
    addAccommodation: (accommodation: Omit<Accommodation, 'id' | 'userId'>) => void;
    updateAccommodation: (id: string, updatedData: Partial<Omit<Accommodation, 'id' | 'userId'>>) => Promise<void>;
    deleteAccommodation: (id: string) => void;
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
    updateEncounter: async () => {},
    deleteEncounter: () => {},
    dishes: [],
    addDish: () => {},
    updateDish: async () => {},
    deleteDish: () => {},
    accommodations: [],
    addAccommodation: () => {},
    updateAccommodation: async () => {},
    deleteAccommodation: () => {},
});

interface TimelineProviderProps {
    children: React.ReactNode;
}

export const TimelineProvider = ({ children }: TimelineProviderProps) => {
    const { user } = useAuth();
    const [instants, setInstants] = useState<Instant[]>([]);
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
    const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
    const [activeStay, setActiveStay] = useState<Trip | null>(null);


    useEffect(() => {
        const loadData = async () => {
          if (!user) {
            setInstants([]);
            setEncounters([]);
            setDishes([]);
            setAccommodations([]);
            return;
          };

          const loadedInstants = await getInstants(user.uid);
          const loadedEncounters = await getEncounters(user.uid);
          const loadedDishes = await getDishes(user.uid);
          const loadedAccommodations = await getAccommodations(user.uid);
          
          const processedInstants = loadedInstants.map(addRuntimeAttributes);

          setInstants(processedInstants);
          setEncounters(loadedEncounters);
          setDishes(loadedDishes);
          setAccommodations(loadedAccommodations);
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
      }, [user]);

    const addInstant = async (instantData: Omit<Instant, 'id'|'userId'>) => {
        if(!user) return;
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
        
        const newInstantForDb: Omit<Instant, 'id' | 'icon' | 'color'> = {
            ...instantData,
            category: category,
            userId: user.uid,
        };
        
        const newId = await saveInstant(newInstantForDb);
        const newInstantForState = addRuntimeAttributes({ id: newId, ...newInstantForDb });

        setInstants(prevInstants => [newInstantForState, ...prevInstants]);
    };

    const addEncounter = async (encounterData: Omit<Encounter, 'id' | 'userId'>) => {
        if(!user) return;
        const encounterForDb = { ...encounterData, userId: user.uid };
        const newId = await saveEncounter(encounterForDb);
        setEncounters(prev => [{...encounterForDb, id: newId}, ...prev]);
    }

    const addDish = async (dishData: Omit<Dish, 'id' | 'userId'>) => {
        if(!user) return;
        const dishForDb = { ...dishData, userId: user.uid };
        const newId = await saveDish(dishForDb);
        setDishes(prev => [{...dishForDb, id: newId}, ...prev]);
    }

    const addAccommodation = async (accommodationData: Omit<Accommodation, 'id' | 'userId'>) => {
        if(!user) return;
        const accommodationForDb = { ...accommodationData, userId: user.uid };
        const newId = await saveAccommodation(accommodationForDb);
        setAccommodations(prev => [{...accommodationForDb, id: newId}, ...prev]);
    }


    const updateInstant = async (id: string, updatedInstantData: Partial<Omit<Instant, 'id'|'userId'>>) => {
        if(!user) return;
        const originalInstant = instants.find(inst => inst.id === id);
        if (!originalInstant) return;
    
        const updatedInstant = { ...originalInstant, ...updatedInstantData };
    
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
    
        await saveInstant(updatedInstant, id);
    
        const updatedInstantForState = addRuntimeAttributes(updatedInstant);
    
        setInstants(prevInstants => prevInstants.map(instant =>
            instant.id === id ? updatedInstantForState : instant
        ));
    }
    

    const deleteInstant = async (id: string) => {
        if(!user) return;
        const instantToDelete = instants.find(i => i.id === id);
        if (!instantToDelete) return;
    
        await deleteInstantFromDB(id);
    
        const remainingInstants = instants.filter(instant => instant.id !== id);
        setInstants(remainingInstants);
    
        const dayKeyOfDeletedInstant = format(startOfDay(parseISO(instantToDelete.date)), 'yyyy-MM-dd');
        const isLastInstantOfDay = !remainingInstants.some(i => format(startOfDay(parseISO(i.date)), 'yyyy-MM-dd') === dayKeyOfDeletedInstant);
    
        if (isLastInstantOfDay) {
            const allStories = await getStories(user.uid);
            for (const story of allStories) {
                const storyContainsDay = story.id.includes(dayKeyOfDeletedInstant);
                if (storyContainsDay) {
                    await deleteStoryFromDB(story.id);
                }
            }
            window.dispatchEvent(new Event('stories-updated'));
        }
    };

    const deleteEncounter = async (id: string) => {
        if(!user) return;
        await deleteEncounterFromDB(id);
        setEncounters(prev => prev.filter(encounter => encounter.id !== id));
    }
    
    const deleteDish = async (id: string) => {
        if(!user) return;
        await deleteDishFromDB(id);
        setDishes(prev => prev.filter(dish => dish.id !== id));
    }

    const deleteAccommodation = async (id: string) => {
        if(!user) return;
        await deleteAccommodationFromDB(id);
        setAccommodations(prev => prev.filter(accommodation => accommodation.id !== id));
    }

    const deleteInstantsByLocation = async (locationName: string) => {
        if(!user) return;
        const instantsToDelete = instants.filter(i => i.location === locationName);
        for (const instant of instantsToDelete) {
            await deleteInstantFromDB(instant.id);
        }
        setInstants(prev => prev.filter(i => i.location !== locationName));
    };

    const groupedInstants = useMemo(() => {
      const groups: GroupedInstants = {};
      
      const sortedInstants = [...instants].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const dayKeysWithIndices = [...new Set(sortedInstants.map(i => format(startOfDay(parseISO(i.date)), 'yyyy-MM-dd')))]
          .map((dayKey, index, allKeys) => ({ dayKey, dayNumber: allKeys.length - index }));

      dayKeysWithIndices.forEach(({ dayKey, dayNumber }) => {
          const dayDate = parseISO(dayKey);
          groups[dayKey] = {
              title: `Jour ${dayNumber} (${format(dayDate, 'd MMMM yyyy', { locale: fr })})`,
              instants: []
          };
      });

      sortedInstants.forEach(instant => {
          const dayKey = format(startOfDay(parseISO(instant.date)), 'yyyy-MM-dd');
          if (groups[dayKey]) {
              groups[dayKey].instants.push(instant);
          }
      });
      
      return groups;

    }, [instants]);

    const updateEncounter = async (id: string, updatedData: Partial<Omit<Encounter, 'id' | 'userId'>>) => {
        if(!user) return;
        const encounterToUpdate = encounters.find(e => e.id === id);
        if(!encounterToUpdate) return;
        const updatedEncounter = {...encounterToUpdate, ...updatedData};
        await saveEncounter(updatedEncounter, id);
        setEncounters(prev => prev.map(e => e.id === id ? updatedEncounter : e));
    };

    const updateDish = async (id: string, updatedData: Partial<Omit<Dish, 'id' | 'userId'>>) => {
        if(!user) return;
        const dishToUpdate = dishes.find(d => d.id === id);
        if(!dishToUpdate) return;
        const updatedDish = {...dishToUpdate, ...updatedData};
        await saveDish(updatedDish, id);
        setDishes(prev => prev.map(d => d.id === id ? updatedDish : d));
    };

    const updateAccommodation = async (id: string, updatedData: Partial<Omit<Accommodation, 'id' | 'userId'>>) => {
        if(!user) return;
        const accommodationToUpdate = accommodations.find(a => a.id === id);
        if(!accommodationToUpdate) return;
        const updatedAccommodation = {...accommodationToUpdate, ...updatedData};
        await saveAccommodation(updatedAccommodation, id);
        setAccommodations(prev => prev.map(a => a.id === id ? updatedAccommodation : a));
    };


    return (
        <TimelineContext.Provider value={{ instants, groupedInstants, addInstant, updateInstant, deleteInstant, deleteInstantsByLocation, activeTrip, activeStay, encounters, addEncounter, updateEncounter, deleteEncounter, dishes, addDish, updateDish, deleteDish, accommodations, addAccommodation, updateAccommodation, deleteAccommodation }}>
            {children}
        </TimelineContext.Provider>
    )
}
