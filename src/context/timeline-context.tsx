

"use client";

import React, { createContext, useState, useMemo, useEffect, useCallback } from 'react';
import type { Instant, Trip, Encounter, Dish, Accommodation } from '@/lib/types';
import { BookText, Utensils, Camera, Palette, ShoppingBag, Landmark, Mountain, Heart, Plane, Car, Train, Bus, Ship, Anchor, Leaf } from "lucide-react";
import { format, startOfDay, parseISO, isToday, isYesterday, formatRelative } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatInstantDate, getCity, getCountry, abbreviateCity } from '@/lib/utils';
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
import { getPendingMedia, removeFromQueue } from '@/lib/offline-sync';


interface GroupedInstants {
    [key: string]: {
        title: string;
        instants: Instant[];
    };
}

interface TimelineContextType {
    instants: Instant[];
    groupedInstants: GroupedInstants;
    addInstant: (instant: Omit<Instant, 'id'>) => Promise<string>;
    updateInstant: (id: string, updatedInstant: Partial<Omit<Instant, 'id'>>) => void;
    deleteInstant: (id: string) => void;
    deleteInstantsByLocation: (locationName: string) => void;
    activeTrip: Trip | null;
    activeStay: Trip | null; // Using Trip type for Stay as well
    encounters: Encounter[];
    addEncounter: (encounter: Omit<Encounter, 'id'>) => Promise<string>;
    updateEncounter: (id: string, updatedData: Partial<Omit<Encounter, 'id'>>) => Promise<void>;
    deleteEncounter: (id: string) => void;
    dishes: Dish[];
    addDish: (dish: Omit<Dish, 'id'>) => Promise<string>;
    updateDish: (id: string, updatedData: Partial<Omit<Dish, 'id'>>) => Promise<void>;
    deleteDish: (id: string) => void;
    accommodations: Accommodation[];
    addAccommodation: (accommodation: Omit<Accommodation, 'id'>) => Promise<string>;
    updateAccommodation: (id: string, updatedData: Partial<Omit<Accommodation, 'id'>>) => Promise<void>;
    deleteAccommodation: (id: string) => void;
    isOnline: boolean;
    isSyncing: boolean;
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
    isOnline: true,
    isSyncing: false,
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
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

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

        const handleOnline = () => {
            setIsOnline(true);
            syncMediaQueue();
        };
        const handleOffline = () => setIsOnline(false);

        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
            syncMediaQueue(); // Try syncing on load
        }

        syncActiveContextsFromStorage(); // Initial load
        window.addEventListener('storage', handleStorageChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const intervalId = window.setInterval(() => {
            syncActiveContextsFromStorage();
            if (navigator.onLine) syncMediaQueue();
        }, 60 * 60 * 1000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.clearInterval(intervalId);
        }
    }, [user, syncActiveContextsFromStorage]);

    const syncMediaQueue = async () => {
        if (!user || isSyncing || !navigator.onLine) return;
        
        const queue = await getPendingMedia();
        if (queue.length === 0) return;

        setIsSyncing(true);
        console.log(`[OfflineSync] Found ${queue.length} items to sync.`);

        for (const item of queue) {
            try {
                // 1. Upload to Cloudinary
                const formData = new FormData();
                const blob = item.data instanceof Blob ? item.data : await (await fetch(item.data)).blob();
                formData.append('file', blob);

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) throw new Error("Upload failed");
                const result = await response.json();
                const remoteUrl = result.secure_url;

                // 2. Update Firestore
                if (item.collection === 'instants') {
                    const instant = instants.find(i => i.id === item.docId);
                    if (instant) {
                        const updatedPhotos = [...(instant.photos || [])];
                        // Replace the temporary dataUrl or placeholder if needed, 
                        // but here we just add/update the real one.
                        // In regular add flow, we can push it.
                        const newPhotos = updatedPhotos.map(p => p.startsWith('data:') ? remoteUrl : p);
                        if (!newPhotos.includes(remoteUrl) && !updatedPhotos.some(p => p.startsWith('data:'))) {
                            newPhotos.push(remoteUrl);
                        }
                        await saveInstant(user.uid, { ...instant, photos: newPhotos }, item.docId);
                    }
                } else {
                    // Encounter, Dish, Accommodation
                    const updateData = { [item.fieldName]: remoteUrl };
                    if (item.collection === 'encounters') await saveEncounter(user.uid, updateData, item.docId);
                    else if (item.collection === 'dishes') await saveDish(user.uid, updateData, item.docId);
                    else if (item.collection === 'accommodations') await saveAccommodation(user.uid, updateData, item.docId);
                }

                // 3. Remove from queue
                await removeFromQueue(item.id);
                console.log(`[OfflineSync] Synced item ${item.id} successfully.`);
            } catch (error) {
                console.error(`[OfflineSync] Failed to sync item ${item.id}:`, error);
            }
        }
        setIsSyncing(false);
    };

    const addInstant = async (instantData: Omit<Instant, 'id'>) => {
        if (!user) throw new Error("User not authenticated");
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
        return newId;
    };

    const addEncounter = async (encounterData: Omit<Encounter, 'id'>) => {
        if (!user) throw new Error("User not authenticated");
        const newId = await saveEncounter(user.uid, encounterData);
        setEncounters(prev => [{ ...encounterData, id: newId }, ...prev]);
        return newId;
    }

    const addDish = async (dishData: Omit<Dish, 'id'>) => {
        if (!user) throw new Error("User not authenticated");
        const newId = await saveDish(user.uid, dishData);
        setDishes(prev => [{ ...dishData, id: newId }, ...prev]);
        return newId;
    }

    const addAccommodation = async (accommodationData: Omit<Accommodation, 'id'>) => {
        if (!user) throw new Error("User not authenticated");
        const newId = await saveAccommodation(user.uid, accommodationData);
        setAccommodations(prev => [{ ...accommodationData, id: newId }, ...prev]);
        return newId;
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

    const deleteCloudinaryResources = async (resources: { url: string; type: 'image' | 'video' }[]) => {
        if (!resources || resources.length === 0) return;
        try {
            await fetch('/api/delete-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resources }),
            });
        } catch (error) {
            console.error("Failed to trigger resource deletion:", error);
        }
    }


    const deleteInstant = async (id: string) => {
        if (!user) return;
        const instantToDelete = instants.find(i => i.id === id);
        if (!instantToDelete) return;

        // Delete media from Cloudinary first
        const resourcesToDelete: { url: string; type: 'image' | 'video' }[] = [];
        if (instantToDelete.photos && instantToDelete.photos.length > 0) {
            instantToDelete.photos.forEach(url => resourcesToDelete.push({ url, type: 'image' }));
        }
        if (instantToDelete.audio) {
            resourcesToDelete.push({ url: instantToDelete.audio, type: 'video' });
        }
        if (resourcesToDelete.length > 0) {
            await deleteCloudinaryResources(resourcesToDelete);
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
        const resourcesToDelete: { url: string; type: 'image' | 'video' }[] = [];
        if (itemToDelete.photo) resourcesToDelete.push({ url: itemToDelete.photo, type: 'image' });
        if (itemToDelete.audio) resourcesToDelete.push({ url: itemToDelete.audio, type: 'video' });
        if (resourcesToDelete.length > 0) await deleteCloudinaryResources(resourcesToDelete);

        await deleteEncounterFromDB(user.uid, id);
        setEncounters(prev => prev.filter(encounter => encounter.id !== id));
    }

    const deleteDish = async (id: string) => {
        if (!user) return;
        const itemToDelete = dishes.find(i => i.id === id);
        if (!itemToDelete) return;
        const resourcesToDelete: { url: string; type: 'image' | 'video' }[] = [];
        if (itemToDelete.photo) resourcesToDelete.push({ url: itemToDelete.photo, type: 'image' });
        if (itemToDelete.audio) resourcesToDelete.push({ url: itemToDelete.audio, type: 'video' });
        if (resourcesToDelete.length > 0) await deleteCloudinaryResources(resourcesToDelete);

        await deleteDishFromDB(user.uid, id);
        setDishes(prev => prev.filter(dish => dish.id !== id));
    }

    const deleteAccommodation = async (id: string) => {
        if (!user) return;
        const itemToDelete = accommodations.find(i => i.id === id);
        if (!itemToDelete) return;
        const resourcesToDelete: { url: string; type: 'image' | 'video' }[] = [];
        if (itemToDelete.photo) resourcesToDelete.push({ url: itemToDelete.photo, type: 'image' });
        if (itemToDelete.audio) resourcesToDelete.push({ url: itemToDelete.audio, type: 'video' });
        if (resourcesToDelete.length > 0) await deleteCloudinaryResources(resourcesToDelete);

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

            const locationStrings = Array.from(locations).map(location => {
                const city = abbreviateCity(getCity(location));
                const country = getCountry(location);
                if (city && country) return `${city}, ${country}`;
                if (city) return city;
                if (country) return country;
                return location;
            });

            const locationString = locationStrings.length > 0
                ? Array.from(new Set(locationStrings)).join(' • ')
                : 'Journée sans lieu'; // Fallback if no location

            const dayDate = parseISO(dayKey);
            const formattedDay = formatInstantDate(dayKey) || format(dayDate, 'd MMM yy', { locale: fr }).replace(/\./g, '');
            groups[dayKey].title = `${locationString} (${formattedDay})`;
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
        <TimelineContext.Provider value={{ instants, groupedInstants, addInstant, updateInstant, deleteInstant, deleteInstantsByLocation, activeTrip, activeStay, encounters, addEncounter, updateEncounter, deleteEncounter, dishes, addDish, updateDish, deleteDish, accommodations, addAccommodation, updateAccommodation, deleteAccommodation, isOnline, isSyncing }}>
            {children}
        </TimelineContext.Provider>
    )
}
