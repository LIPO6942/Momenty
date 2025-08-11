

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
    orderBy
} from "firebase/firestore";
import type { GeneratedStory, Instant, Encounter, Dish, Accommodation } from './types';


export interface ManualLocation {
    name: string;
    startDate?: string;
    endDate?: string;
    photos?: string[];
    souvenir?: string;
}

// --- Generic CRUD Functions for user-specific subcollections ---

const saveDataInSubcollection = async <T>(userId: string, collectionName: string, data: Omit<T, 'id'>, id?: string): Promise<string> => {
    const subcollectionRef = collection(db, 'users', userId, collectionName);
    const docRef = id ? doc(subcollectionRef, id) : doc(subcollectionRef);
    
    await setDoc(docRef, data, { merge: true });
    
    return docRef.id;
};

const getDataFromSubcollection = async <T>(userId: string, collectionName: string): Promise<(T & { id: string })[]> => {
    const subcollectionRef = collection(db, 'users', userId, collectionName);
    const q = query(subcollectionRef, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T & { id: string }));
};

const deleteDataFromSubcollection = async (userId: string, collectionName: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId, collectionName, id));
};


// --- Instant Functions ---
export const saveInstant = (userId: string, instant: Omit<Instant, 'id'>) => saveDataInSubcollection(userId, 'instants', instant, instant.id);
export const getInstants = (userId: string): Promise<Instant[]> => getDataFromSubcollection<Instant>('instants', userId);
export const deleteInstant = (userId: string, id: string) => deleteDataFromSubcollection(userId, 'instants', id);

// --- Encounter Functions ---
export const saveEncounter = (userId: string, encounter: Omit<Encounter, 'id'>, id?: string) => saveDataInSubcollection(userId, 'encounters', encounter, id);
export const getEncounters = (userId: string): Promise<Encounter[]> => getDataFromSubcollection<Encounter>('encounters', userId);
export const deleteEncounter = (userId: string, id: string) => deleteDataFromSubcollection(userId, 'encounters', id);

// --- Dish Functions ---
export const saveDish = (userId: string, dish: Omit<Dish, 'id'>, id?: string) => saveDataInSubcollection(userId, 'dishes', dish, id);
export const getDishes = (userId: string): Promise<Dish[]> => getDataFromSubcollection<Dish>('dishes', userId);
export const deleteDish = (userId: string, id: string) => deleteDataFromSubcollection(userId, 'dishes', id);

// --- Accommodation Functions ---
export const saveAccommodation = (userId: string, accommodation: Omit<Accommodation, 'id'>, id?: string) => saveDataInSubcollection(userId, 'accommodations', accommodation, id);
export const getAccommodations = (userId: string): Promise<Accommodation[]> => getDataFromSubcollection<Accommodation>('accommodations', userId);
export const deleteAccommodation = (userId: string, id: string) => deleteDataFromSubcollection(userId, 'accommodations', id);

// --- Story Functions ---
export const saveStory = (userId: string, story: GeneratedStory, id?: string) => {
    const storyForDb = { ...story };
    // @ts-ignore
    storyForDb.instants = story.instants.map(i => i.id);
    return saveDataInSubcollection(userId, 'stories', storyForDb, id || story.id);
};
export const getStories = (userId: string): Promise<GeneratedStory[]> => getDataFromSubcollection<GeneratedStory>('stories', userId);
export const deleteStory = (userId: string, id: string) => deleteDataFromSubcollection(userId, 'stories', id);

// --- Manual Locations Functions (stored under the user document) ---

export const saveManualLocations = async (userId: string, locations: ManualLocation[]): Promise<void> => {
    const docRef = doc(db, 'users', userId);
    await setDoc(docRef, { manualLocations: locations }, { merge: true });
};

export const getManualLocations = async (userId: string): Promise<ManualLocation[]> => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().manualLocations || [];
    }
    return [];
};
