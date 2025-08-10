

"use client";

import React, { createContext, useState, useMemo, useEffect, useCallback } from 'react';
import type { Instant, Trip, Encounter, Dish, Accommodation } from '@/lib/types';
import { BookText, Utensils, Camera, Palette, ShoppingBag, Landmark, Mountain, Heart, Plane, Car, Train, Bus, Ship, Anchor, Leaf } from "lucide-react";
import { format, startOfDay, parseISO, isToday, isYesterday, formatRelative } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getImage, getInstants, saveInstant, deleteInstantFromDB, saveImage, getEncounters, deleteEncounter as deleteEncounterFromDB, saveEncounter, getDishes, saveDish, deleteDish as deleteDishFromDB, getStories, saveStory, deleteStory as deleteStoryFromDB, getAccommodations, saveAccommodation, deleteAccommodation as deleteAccommodationFromDB, deleteImage } from '@/lib/idb';
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
    updateEncounter: (id: string, updatedData: Partial<Omit<Encounter, 'id'>>) => Promise<void>;
    deleteEncounter: (id: string) => void;
    dishes: Dish[];
    addDish: (dish: Omit<Dish, 'id'>) => void;
    updateDish: (id: string, updatedData: Partial<Omit<Dish, 'id'>>) => Promise<void>;
    deleteDish: (id: string) => void;
    accommodations: Accommodation[];
    addAccommodation: (accommodation: Omit<Accommodation, 'id'>) => void;
    updateAccommodation: (id: string, updatedData: Partial<Omit<Accommodation, 'id'>>) => Promise<void>;
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
    const [instants, setInstants] = useState<Instant[]>([]);
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
    const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
    const [activeStay, setActiveStay] = useState<Trip | null>(null);

    const getFullPhotoData = useCallback(async <T extends { id: string, photo?: string | null, photos?: string[] | null }>(item: T): Promise<T> => {
        let finalPhoto = item.photo;
        const photoKey = item.photo; 
        if (photoKey && (photoKey.startsWith('local_') || photoKey.startsWith('encounter_') || photoKey.startsWith('dish_') || photoKey.startsWith('accommodation_'))) {
            const localPhoto = await getImage(photoKey);
            finalPhoto = localPhoto; 
        }

        let finalPhotos: string[] | undefined | null = item.photos;
        if (item.photos && item.photos.length > 0) {
            finalPhotos = await Promise.all(
                item.photos.map(async (key) => {
                    if (key.startsWith('local_')) {
                        return await getImage(key) || key;
                    }
                    return key;
                })
            )
        }

        return { ...item, photo: finalPhoto, photos: finalPhotos };
    }, []);

    useEffect(() => {
        const loadData = async () => {
          let loadedInstants = await getInstants();
          let loadedEncounters = await getEncounters();
          let loadedDishes = await getDishes();
          let loadedAccommodations = await getAccommodations();
          
          const processedInstants = await Promise.all(
            loadedInstants.map(async (inst) => {
              const instWithPhotoData = await getFullPhotoData(inst);
              const { icon, color } = getCategoryAttributes(inst.category);
              return { ...instWithPhotoData, icon, color };
            })
          );
          
          const processedEncounters = await Promise.all(loadedEncounters.map(e => getFullPhotoData(e)));
          const processedDishes = await Promise.all(loadedDishes.map(d => getFullPhotoData(d)));
          const processedAccommodations = await Promise.all(loadedAccommodations.map(a => getFullPhotoData(a)));

          setInstants(processedInstants.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          setEncounters(processedEncounters.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          setDishes(processedDishes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          setAccommodations(processedAccommodations.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
            photos: null,
            category: category,
        };
        
        if (instantWithContext.photos && instantWithContext.photos.length > 0) {
            const photoKeys = await Promise.all(
                instantWithContext.photos.map((photo, index) => {
                    const key = `local_${newInstantId}_${index}`;
                    saveImage(key, photo);
                    return key;
                })
            );
            newInstantForDb.photos = photoKeys;
        }
        
        await saveInstant(newInstantForDb as Instant);
        
        const newInstantForState = addRuntimeAttributes({
            ...newInstantForDb,
            photos: instantData.photos
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

    const addAccommodation = async (accommodationData: Omit<Accommodation, 'id'>) => {
        const newAccommodationId = new Date().toISOString() + Math.random();
        const accommodationForDb = { id: newAccommodationId, ...accommodationData, photo: null };
        const accommodationForState = { id: newAccommodationId, ...accommodationData };

        if (accommodationData.photo) {
            const photoId = `accommodation_${newAccommodationId}`;
            await saveImage(photoId, accommodationData.photo);
            accommodationForDb.photo = photoId;
        }

        await saveAccommodation(accommodationForDb as Accommodation);
        
        setAccommodations(prev => [accommodationForState, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }


    const updateInstant = async (id: string, updatedInstantData: Partial<Omit<Instant, 'id'>>) => {
        const originalInstant = instants.find(inst => inst.id === id);
        if (!originalInstant) return;
    
        const updatedInstant = { ...originalInstant, ...updatedInstantData };
    
        // Handle photo updates
        if (updatedInstantData.photos) {
            // Delete old photos first
            if(originalInstant.photos) {
                for(let i=0; i < originalInstant.photos.length; i++) {
                    await deleteImage(`local_${id}_${i}`);
                }
            }
    
            // Save new photos
            const photoKeys = await Promise.all(
                updatedInstantData.photos.map((photo, index) => {
                    const key = `local_${id}_${index}`;
                    if(photo.startsWith('data:')) {
                        saveImage(key, photo);
                    }
                    return key;
                })
            );
            updatedInstant.photos = photoKeys;
        } else if (updatedInstantData.photos === null) {
             if(originalInstant.photos) {
                for(let i=0; i < originalInstant.photos.length; i++) {
                    await deleteImage(`local_${id}_${i}`);
                }
            }
            updatedInstant.photos = null;
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
            photos: updatedInstant.photos,
            category: updatedInstant.category
        };
    
        await saveInstant(updatedInstantForDb);
    
        const updatedInstantForState = addRuntimeAttributes({
            ...updatedInstantForDb,
            photos: updatedInstantData.photos // keep data URLs for state
        });
    
        setInstants(prevInstants => prevInstants.map(instant =>
            instant.id === id ? updatedInstantForState : instant
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }
    

    const deleteInstant = async (id: string) => {
        const instantToDelete = instants.find(i => i.id === id);
        if (!instantToDelete) return;
    
        const dayKeyOfDeletedInstant = format(startOfDay(parseISO(instantToDelete.date)), 'yyyy-MM-dd');
    
        await deleteInstantFromDB(id);
        if (instantToDelete.photos) {
            for(let i=0; i < instantToDelete.photos.length; i++) {
                await deleteImage(`local_${id}_${i}`);
            }
        }
    
        const remainingInstants = instants.filter(instant => instant.id !== id);
        setInstants(remainingInstants);
    
        const isLastInstantOfDay = !remainingInstants.some(i => format(startOfDay(parseISO(i.date)), 'yyyy-MM-dd') === dayKeyOfDeletedInstant);
    
        if (isLastInstantOfDay) {
            const allStories = await getStories();
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
        await deleteEncounterFromDB(id);
        setEncounters(prev => prev.filter(encounter => encounter.id !== id));
    }
    
    const deleteDish = async (id: string) => {
        await deleteDishFromDB(id);
        setDishes(prev => prev.filter(dish => dish.id !== id));
    }

    const deleteAccommodation = async (id: string) => {
        await deleteAccommodationFromDB(id);
        setAccommodations(prev => prev.filter(accommodation => accommodation.id !== id));
    }

    const deleteInstantsByLocation = async (locationName: string) => {
        const instantsToDelete = instants.filter(i => i.location === locationName);
        for (const instant of instantsToDelete) {
            await deleteInstantFromDB(instant.id);
            if(instant.photos) {
                for(let i=0; i < instant.photos.length; i++) {
                    await deleteImage(`local_${instant.id}_${i}`);
                }
            }
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

    const updateEncounter = async (id: string, updatedData: Partial<Omit<Encounter, 'id'>>) => {
        const originalEncounter = encounters.find(e => e.id === id);
        if (!originalEncounter) return;

        const updatedEncounter = { ...originalEncounter, ...updatedData };
        
        const photoKey = `encounter_${id}`;
        if (updatedData.photo && updatedData.photo.startsWith('data:')) {
            await saveImage(photoKey, updatedData.photo);
        } else if (updatedData.photo === null) {
            await deleteImage(photoKey);
        }
        
        const encounterForDb: Encounter = {
            ...updatedEncounter,
            photo: updatedEncounter.photo ? photoKey : null,
        };
        await saveEncounter(encounterForDb);

        setEncounters(prev => prev.map(e => (e.id === id ? updatedEncounter : e)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    const updateDish = async (id: string, updatedData: Partial<Omit<Dish, 'id'>>) => {
        const originalDish = dishes.find(d => d.id === id);
        if (!originalDish) return;
        
        const updatedDish = { ...originalDish, ...updatedData };
        
        const photoKey = `dish_${id}`;
        if (updatedData.photo && updatedData.photo.startsWith('data:')) {
            await saveImage(photoKey, updatedData.photo);
        } else if (updatedData.photo === null) {
            await deleteImage(photoKey);
        }
        
        const dishForDb: Dish = {
            ...updatedDish,
            photo: updatedDish.photo ? photoKey : null,
        };
        await saveDish(dishForDb);
        
        setDishes(prev => prev.map(d => (d.id === id ? updatedDish : d)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };

    const updateAccommodation = async (id: string, updatedData: Partial<Omit<Accommodation, 'id'>>) => {
        const originalAccommodation = accommodations.find(a => a.id === id);
        if (!originalAccommodation) return;
        
        const updatedAccommodation = { ...originalAccommodation, ...updatedData };
        
        const photoKey = `accommodation_${id}`;
        if (updatedData.photo && updatedData.photo.startsWith('data:')) {
            await saveImage(photoKey, updatedData.photo);
        } else if (updatedData.photo === null) {
            await deleteImage(photoKey);
        }
        
        const accommodationForDb: Accommodation = {
            ...updatedAccommodation,
            photo: updatedAccommodation.photo ? photoKey : null,
        };
        await saveAccommodation(accommodationForDb);
        
        setAccommodations(prev => prev.map(a => (a.id === id ? updatedAccommodation : a)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    };


    return (
        <TimelineContext.Provider value={{ instants, groupedInstants, addInstant, updateInstant, deleteInstant, deleteInstantsByLocation, activeTrip, activeStay, encounters, addEncounter, updateEncounter, deleteEncounter, dishes, addDish, updateDish, deleteDish, accommodations, addAccommodation, updateAccommodation, deleteAccommodation }}>
            {children}
        </TimelineContext.Provider>
    )
}
