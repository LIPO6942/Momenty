
"use client";

import { db } from "./firebase";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    doc, 
    setDoc, 
    deleteDoc, 
    writeBatch,
    documentId,
    getDoc,
    orderBy,
    collectionGroup,
    where
} from "firebase/firestore";
import type { GeneratedStory, Instant, Encounter, Dish, Accommodation, Itinerary } from './types';


export interface ManualLocation {
    name: string;
    startDate?: string;
    endDate?: string;
    photos?: string[];
    souvenir?: string;
}

// --- Generic CRUD Functions for user-specific subcollections ---

const saveDataInSubcollection = async <T extends {id?: string, icon?: any, color?: any}>(userId: string, collectionName: string, data: Omit<T, 'id'>, id?: string): Promise<string> => {
    const subcollectionRef = collection(db, 'users', userId, collectionName);
    const docRef = id ? doc(subcollectionRef, id) : doc(subcollectionRef);
    
    // Create a copy of the data and remove properties that shouldn't be in Firestore.
    // This prevents "INTERNAL ASSERTION FAILED" errors from trying to save React components.
    const dataToSave = { ...data };
    delete dataToSave.icon;
    delete dataToSave.color;

    await setDoc(docRef, dataToSave, { merge: true });
    return docRef.id;
};


const getDataFromSubcollection = async <T>(userId: string, collectionName: string): Promise<(T & { id: string })[]> => {
    const subcollectionRef = collection(db, 'users', userId, collectionName);
    const q = query(subcollectionRef, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T & { id: string }));
};

const getItinerariesFromSubcollection = async <T>(userId: string, collectionName: string): Promise<(T & { id: string })[]> => {
    const subcollectionRef = collection(db, 'users', userId, collectionName);
    const q = query(subcollectionRef, orderBy("createdAt", "desc")); // Order by creation date for itineraries
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T & { id: string }));
};


const deleteDataFromSubcollection = async (userId: string, collectionName: string, id: string): Promise<void> => {
    const docRef = doc(db, 'users', userId, collectionName, id);
    await deleteDoc(docRef);
};


// --- Instant Functions ---
export const saveInstant = (userId: string, instant: Omit<Instant, 'id'>, id?: string) => saveDataInSubcollection(userId, 'instants', instant, id);
export const getInstants = (userId: string): Promise<Instant[]> => getDataFromSubcollection<Instant>(userId, 'instants');
export const deleteInstant = (userId: string, id: string) => deleteDataFromSubcollection(userId, 'instants', id);

// --- Encounter Functions ---
export const saveEncounter = (userId: string, encounter: Omit<Encounter, 'id'>, id?: string) => saveDataInSubcollection(userId, 'encounters', encounter, id);
export const getEncounters = (userId: string): Promise<Encounter[]> => getDataFromSubcollection<Encounter>(userId, 'encounters');
export const deleteEncounter = (userId: string, id: string) => deleteDataFromSubcollection(userId, 'encounters', id);

// --- Dish Functions ---
export const saveDish = (userId: string, dish: Omit<Dish, 'id'>, id?: string) => saveDataInSubcollection(userId, 'dishes', dish, id);
export const getDishes = (userId: string): Promise<Dish[]> => getDataFromSubcollection<Dish>(userId, 'dishes');
export const deleteDish = (userId: string, id: string) => deleteDataFromSubcollection(userId, 'dishes', id);

// --- Accommodation Functions ---
export const saveAccommodation = (userId: string, accommodation: Omit<Accommodation, 'id'>, id?: string) => saveDataInSubcollection(userId, 'accommodations', accommodation, id);
export const getAccommodations = (userId: string): Promise<Accommodation[]> => getDataFromSubcollection<Accommodation>(userId, 'accommodations');
export const deleteAccommodation = (userId: string, id: string) => deleteDataFromSubcollection(userId, 'accommodations', id);

// --- Story Functions ---
export const saveStory = (userId: string, story: GeneratedStory, id?: string) => {
    // @ts-ignore
    const instantsForDb = story.instants.map(i => i.id);
    const storyForDb = { ...story, instants: instantsForDb };
    return saveDataInSubcollection(userId, 'stories', storyForDb, id || story.id);
};
export const getStories = async (userId: string): Promise<GeneratedStory[]> => {
    const stories = await getDataFromSubcollection<GeneratedStory>(userId, 'stories');
    
    if (stories.length === 0) return [];
    
    // Fetch all instants for the user at once to hydrate the stories
    const allInstants = await getInstants(userId);
    const instantsById = new Map(allInstants.map(i => [i.id, i]));

    return stories.map(story => {
        const storyInstants = (story.instants as unknown as string[])
            .map(id => instantsById.get(id))
            .filter(Boolean) as Instant[];
        return { ...story, instants: storyInstants };
    });
};
export const deleteStory = (userId: string, id: string) => deleteDataFromSubcollection(userId, 'stories', id);


// --- Itinerary Functions ---
export const saveItinerary = (userId: string, itinerary: Itinerary, id?: string) => saveDataInSubcollection(userId, 'itineraries', itinerary, id);
export const getItineraries = (userId: string): Promise<(Itinerary & {id: string})[]> => getItinerariesFromSubcollection<Itinerary>(userId, 'itineraries');
export const deleteItinerary = (userId: string, id: string) => deleteDataFromSubcollection(userId, 'itineraries', id);


// --- User Document Functions (for data not in subcollections) ---

export const saveManualLocations = async (userId: string, locations: ManualLocation[]): Promise<void> => {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, { manualLocations: locations }, { merge: true });
};

export const getManualLocations = async (userId: string): Promise<ManualLocation[]> => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().manualLocations) {
        return docSnap.data().manualLocations;
    }
    return [];
};
