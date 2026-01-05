

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

const getCategoryAttributes = (category?: string[]) => {
    // For now, use the first category to determine icon and color.
    // This could be enhanced later.
    const primaryCategory = category && category.length > 0 ? category[0] : 'Note';

    switch (primaryCategory) {
        case 'Gastronomie': return { icon: <Utensils />, color: 'bg-orange-600' };
        case 'Culture': return { icon: <Landmark />, color: 'bg-purple-700' };
        case 'Nature': return { icon: <Leaf />, color: 'bg-green-600' };
        case 'Shopping': return { icon: <ShoppingBag />, color: 'bg-pink-600' };
        case 'Art': return { icon: <Palette />, color: 'bg-red-600' };
        case 'Détente': return { icon: <Heart />, color: 'bg-teal-600' };
        case 'Voyage': return { icon: <Plane />, color: 'bg-sky-600' };
        case 'Sport': return { icon: <Anchor />, color: 'bg-indigo-600' };
        case 'Plage': return { icon: <Anchor />, color: 'bg-yellow-500' }; // Example, assuming Anchor for beach
        case 'Séjour': return { icon: <Car />, color: 'bg-cyan-600' };
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
    addInstant: () => { },
    updateInstant: () => { },
    deleteInstant: () => { },
    deleteInstantsByLocation: () => { },
    activeTrip: null,
    activeStay: null,
    encounters: [],
    addEncounter: () => { },
    updateEncounter: async () => { },
    deleteEncounter: () => { },
    dishes: [],
    addDish: () => { },
    updateDish: async () => { },
    deleteDish: () => { },
    accommodations: [],
    addAccommodation: () => { },
    updateAccommodation: async () => { },
    deleteAccommodation: () => { },
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

    const isTripExpired = useCallback((trip: Trip) => {
        if (!trip?.endDate) return false;
        try {
            const end = startOfDay(parseISO(trip.endDate));
            const today = startOfDay(new Date());
            return today.getTime() > end.getTime();
        } catch {
            return false;
        }
    }, []);

    const syncActiveContextsFromStorage = useCallback(() => {
        const savedTrip = localStorage.getItem('activeTrip');
        if (savedTrip) {
            try {
                const parsedTrip = JSON.parse(savedTrip) as Trip;
                if (isTripExpired(parsedTrip)) {
                    localStorage.removeItem('activeTrip');
                    setActiveTrip(null);
                } else {
                    setActiveTrip(parsedTrip);
                }
            } catch {
                localStorage.removeItem('activeTrip');
                setActiveTrip(null);
            }
        } else {
            setActiveTrip(null);
        }

        const savedStay = localStorage.getItem('activeStay');
        setActiveStay(savedStay ? JSON.parse(savedStay) : null);
    }, [isTripExpired]);


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
            syncActiveContextsFromStorage();
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                syncActiveContextsFromStorage();
            }
        };

        syncActiveContextsFromStorage(); // Initial load
        window.addEventListener('storage', handleStorageChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const intervalId = window.setInterval(() => {
            syncActiveContextsFromStorage();
        }, 60 * 60 * 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.clearInterval(intervalId);
        }
    }, [user, syncActiveContextsFromStorage]);

    const addInstant = async (instantData: Omit<Instant, 'id'>) => {
        if (!user) return;
        let categories = instantData.category || ['Note'];
        try {
            const result = await categorizeInstant({
                title: instantData.title,
                description: instantData.description,
                location: instantData.location,
            });
            categories = result.categories;
        } catch (error) {
            console.error("AI categorization failed", error);
        }

        const newInstantForDb: Omit<Instant, 'id' | 'icon' | 'color'> = {
            ...instantData,
            category: categories,
        };

        const newId = await saveInstant(user.uid, newInstantForDb);
        const newInstantForState = addRuntimeAttributes({ ...newInstantForDb, id: newId });

        setInstants(prevInstants => [newInstantForState, ...prevInstants]);
    };

    const addEncounter = async (encounterData: Omit<Encounter, 'id'>) => {
        if (!user) return;
        const newId = await saveEncounter(user.uid, encounterData);
        setEncounters(prev => [{ ...encounterData, id: newId }, ...prev]);
    }

    const addDish = async (dishData: Omit<Dish, 'id'>) => {
        if (!user) return;
        const newId = await saveDish(user.uid, dishData);
        setDishes(prev => [{ ...dishData, id: newId }, ...prev]);
    }

    const addAccommodation = async (accommodationData: Omit<Accommodation, 'id'>) => {
        if (!user) return;
        const newId = await saveAccommodation(user.uid, accommodationData);
        setAccommodations(prev => [{ ...accommodationData, id: newId }, ...prev]);
    }


    const updateInstant = async (id: string, updatedInstantData: Partial<Omit<Instant, 'id'>>) => {
        if (!user) return;
        const originalInstant = instants.find(inst => inst.id === id);
        if (!originalInstant) return;

        const updatedInstant = { ...originalInstant, ...updatedInstantData };

        // Only run AI categorization if the category was NOT manually set in the dialog.
        // If updatedInstantData.category exists, it means the user set it manually.
        const userManuallySetCategory = 'category' in updatedInstantData;

        if (!userManuallySetCategory && (updatedInstant.title !== originalInstant.title || updatedInstant.description !== originalInstant.description || updatedInstant.location !== originalInstant.location)) {
            try {
                const { categories } = await categorizeInstant({
                    title: updatedInstant.title,
                    description: updatedInstant.description,
                    location: updatedInstant.location,
                });
                updatedInstant.category = categories;
            } catch (error) {
                console.error("AI categorization failed on update", error);
            }
        }

        const { icon, color, ...instantToSave } = updatedInstant;
        await saveInstant(user.uid, instantToSave, id);

        const updatedInstantForState = addRuntimeAttributes(updatedInstant);

        setInstants(prevInstants => prevInstants.map(instant =>
            instant.id === id ? updatedInstantForState : instant
        ));
    }

    const deleteCloudinaryPhotos = async (photoUrls: string[] | null | undefined) => {
        if (!photoUrls || photoUrls.length === 0) return;
        try {
            await fetch('/api/delete-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoUrls }),
            });
        } catch (error) {
            console.error("Failed to trigger photo deletion:", error);
        }
    }


    const deleteInstant = async (id: string) => {
        if (!user) return;
        const instantToDelete = instants.find(i => i.id === id);
        if (!instantToDelete) return;

        // Delete photos from Cloudinary first
        if (instantToDelete.photos && instantToDelete.photos.length > 0) {
            await deleteCloudinaryPhotos(instantToDelete.photos);
        }

        await deleteInstantFromDB(user.uid, id);

        const remainingInstants = instants.filter(instant => instant.id !== id);
        setInstants(remainingInstants);

        const dayKeyOfDeletedInstant = format(startOfDay(parseISO(instantToDelete.date)), 'yyyy-MM-dd');
        const isLastInstantOfDay = !remainingInstants.some(i => format(startOfDay(parseISO(i.date)), 'yyyy-MM-dd') === dayKeyOfDeletedInstant);

        if (isLastInstantOfDay) {
            const allStories = await getStories(user.uid);
            for (const story of allStories) {
                const storyContainsDay = story.id.includes(dayKeyOfDeletedInstant);
                if (storyContainsDay) {
                    await deleteStoryFromDB(user.uid, story.id);
                }
            }
            window.dispatchEvent(new Event('stories-updated'));
        }
    };

    const deleteEncounter = async (id: string) => {
        if (!user) return;
        const itemToDelete = encounters.find(i => i.id === id);
        if (!itemToDelete) return;
        if (itemToDelete.photo) await deleteCloudinaryPhotos([itemToDelete.photo]);

        await deleteEncounterFromDB(user.uid, id);
        setEncounters(prev => prev.filter(encounter => encounter.id !== id));
    }

    const deleteDish = async (id: string) => {
        if (!user) return;
        const itemToDelete = dishes.find(i => i.id === id);
        if (!itemToDelete) return;
        if (itemToDelete.photo) await deleteCloudinaryPhotos([itemToDelete.photo]);

        await deleteDishFromDB(user.uid, id);
        setDishes(prev => prev.filter(dish => dish.id !== id));
    }

    const deleteAccommodation = async (id: string) => {
        if (!user) return;
        const itemToDelete = accommodations.find(i => i.id === id);
        if (!itemToDelete) return;
        if (itemToDelete.photo) await deleteCloudinaryPhotos([itemToDelete.photo]);

        await deleteAccommodationFromDB(user.uid, id);
        setAccommodations(prev => prev.filter(accommodation => accommodation.id !== id));
    }

    const deleteInstantsByLocation = async (locationName: string) => {
        if (!user) return;
        const instantsToDelete = instants.filter(i => i.location === locationName);
        for (const instant of instantsToDelete) {
            await deleteInstant(instant.id); // This will also handle photo deletion
        }
        // No need to filter state here, as deleteInstant already does it.
    };

    const groupedInstants = useMemo(() => {
        const groups: GroupedInstants = {};

        const sortedInstants = [...instants].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // First, group everything by day
        sortedInstants.forEach(instant => {
            const dayKey = format(startOfDay(parseISO(instant.date)), 'yyyy-MM-dd');
            if (!groups[dayKey]) {
                groups[dayKey] = {
                    title: '', // Will be filled later
                    instants: []
                };
            }
            groups[dayKey].instants.push(instant);
        });

        // Then, generate titles for each day based on locations
        Object.keys(groups).forEach(dayKey => {
            const dayInstants = groups[dayKey].instants;
            const locations = new Set(dayInstants.map(i => i.location).filter(Boolean));
            const locationString = locations.size > 0
                ? Array.from(locations).join(', ')
                : 'Journée sans lieu'; // Fallback if no location

            const dayDate = parseISO(dayKey);
            groups[dayKey].title = `${locationString} (${format(dayDate, 'd MMMM yyyy', { locale: fr })})`;
        });

        return groups;

    }, [instants]);

    const updateEncounter = async (id: string, updatedData: Partial<Omit<Encounter, 'id'>>) => {
        if (!user) return;
        const encounterToUpdate = encounters.find(e => e.id === id);
        if (!encounterToUpdate) return;
        const updatedEncounter = { ...encounterToUpdate, ...updatedData };
        await saveEncounter(user.uid, updatedEncounter, id);
        setEncounters(prev => prev.map(e => e.id === id ? updatedEncounter : e));
    };

    const updateDish = async (id: string, updatedData: Partial<Omit<Dish, 'id'>>) => {
        if (!user) return;
        const dishToUpdate = dishes.find(d => d.id === id);
        if (!dishToUpdate) return;
        const updatedDish = { ...dishToUpdate, ...updatedData };
        await saveDish(user.uid, updatedDish, id);
        setDishes(prev => prev.map(d => d.id === id ? updatedDish : d));
    };

    const updateAccommodation = async (id: string, updatedData: Partial<Omit<Accommodation, 'id'>>) => {
        if (!user) return;
        const accommodationToUpdate = accommodations.find(a => a.id === id);
        if (!accommodationToUpdate) return;
        const updatedAccommodation = { ...accommodationToUpdate, ...updatedData };
        await saveAccommodation(user.uid, updatedAccommodation, id);
        setAccommodations(prev => prev.map(a => a.id === id ? updatedAccommodation : a));
    };


    return (
        <TimelineContext.Provider value={{ instants, groupedInstants, addInstant, updateInstant, deleteInstant, deleteInstantsByLocation, activeTrip, activeStay, encounters, addEncounter, updateEncounter, deleteEncounter, dishes, addDish, updateDish, deleteDish, accommodations, addAccommodation, updateAccommodation, deleteAccommodation }}>
            {children}
        </TimelineContext.Provider>
    )
}
