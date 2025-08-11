

"use client";

import { db } from "./firebase";
import { 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    doc, 
    updateDoc, 
    deleteDoc, 
    writeBatch,
    documentId,
    setDoc,
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

// --- Generic CRUD Functions ---

const saveData = async <T extends { userId: string }>(collectionName: string, data: Omit<T, 'id'>, id?: string): Promise<string> => {
    if (id) {
        const docRef = doc(db, collectionName, id);
        await setDoc(docRef, data, { merge: true }); // Use merge: true for updates
        return id;
    } else {
        const docRef = await addDoc(collection(db, collectionName), data as any);
        return docRef.id;
    }
};

const getData = async <T>(collectionName: string, userId: string): Promise<(T & { id: string })[]> => {
    const q = query(collection(db, collectionName), where("userId", "==", userId), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T & { id: string }));
};

const deleteData = async (collectionName: string, id: string): Promise<void> => {
    await deleteDoc(doc(db, collectionName, id));
};


// --- Instant Functions ---

export const saveInstant = (instant: Omit<Instant, 'id'>, id?: string) => saveData('instants', instant, id);
export const getInstants = (userId: string): Promise<Instant[]> => getData<Instant>('instants', userId);
export const deleteInstant = (id: string) => deleteData('instants', id);

// --- Encounter Functions ---

export const saveEncounter = (encounter: Omit<Encounter, 'id'>, id?: string) => saveData('encounters', encounter, id);
export const getEncounters = (userId: string): Promise<Encounter[]> => getData<Encounter>('encounters', userId);
export const deleteEncounter = (id: string) => deleteData('encounters', id);

// --- Dish Functions ---

export const saveDish = (dish: Omit<Dish, 'id'>, id?: string) => saveData('dishes', dish, id);
export const getDishes = (userId: string): Promise<Dish[]> => getData<Dish>('dishes', userId);
export const deleteDish = (id: string) => deleteData('dishes', id);

// --- Accommodation Functions ---

export const saveAccommodation = (accommodation: Omit<Accommodation, 'id'>, id?: string) => saveData('accommodations', accommodation, id);
export const getAccommodations = (userId: string): Promise<Accommodation[]> => getData<Accommodation>('accommodations', userId);
export const deleteAccommodation = (id: string) => deleteData('accommodations', id);

// --- Story Functions ---

export const saveStory = (story: Omit<GeneratedStory, 'id'>, id?: string) => saveData('stories', story, id);
export const getStories = (userId: string): Promise<GeneratedStory[]> => getData<GeneratedStory>('stories', userId);
export const deleteStory = (id: string) => deleteData('stories', id);

// --- Manual Locations Functions ---
// These are stored in a single document per user for simplicity.

export const saveManualLocations = async (userId: string, locations: ManualLocation[]): Promise<void> => {
    const docRef = doc(db, 'manualLocations', userId);
    await setDoc(docRef, { locations });
};

export const getManualLocations = async (userId: string): Promise<ManualLocation[]> => {
    const docRef = doc(db, 'manualLocations', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data().locations || [];
    }
    return [];
};
