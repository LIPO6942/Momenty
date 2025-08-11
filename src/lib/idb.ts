

"use client";
import type { GeneratedStory, Instant, Encounter, Dish, Accommodation } from './types';

const DB_NAME = "Momenty_DB_DEPRECATED"; // Renamed to avoid conflicts, will be removed later
const IMAGE_STORE_NAME = "images";
const STORY_STORE_NAME = "stories";
const INSTANT_STORE_NAME = "instants";
const PROFILE_STORE_NAME = "profile";
const MANUAL_LOCATIONS_STORE_NAME = "manualLocations";
const ENCOUNTERS_STORE_NAME = "encounters";
const DISHES_STORE_NAME = "dishes";
const ACCOMMODATIONS_STORE_NAME = "accommodations";
const DB_VERSION = 10; // Incremented version

let db: IDBDatabase | null = null;

// Types used in this file
export type ProfileData = {
    id: number; // Use a fixed key for singleton stores
    firstName: string;
    lastName: string;
    age: string;
    gender: string;
};

export interface ManualLocation {
    name: string;
    startDate?: string;
    endDate?: string;
    photos?: string[]; // Will store image keys, not data URLs
    souvenir?: string;
}


const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }
    console.warn("IndexedDB is being initialized. This is for local profile storage only. All other data is now in Firestore.");
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database error:", request.error);
      reject("Database error: " + request.error);
    };

    request.onsuccess = (event) => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains(PROFILE_STORE_NAME)) {
        dbInstance.createObjectStore(PROFILE_STORE_NAME, { keyPath: "id" });
      }
      // Clean up old stores if they exist from previous versions
      const oldStores = [
        IMAGE_STORE_NAME, STORY_STORE_NAME, INSTANT_STORE_NAME, 
        MANUAL_LOCATIONS_STORE_NAME, ENCOUNTERS_STORE_NAME, 
        DISHES_STORE_NAME, ACCOMMODATIONS_STORE_NAME
      ];
      oldStores.forEach(storeName => {
        if (dbInstance.objectStoreNames.contains(storeName)) {
            dbInstance.deleteObjectStore(storeName);
        }
      });
    };
  });
};

// Profile Functions are the only ones remaining in IndexedDB for device-specific settings
export const saveProfile = async (profile: Omit<ProfileData, 'id'>): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROFILE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PROFILE_STORE_NAME);
      // Use a fixed ID for the profile, as there's only one
      const request = store.put({ ...profile, id: 1 }); 
  
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Save profile error:', request.error);
        reject(request.error);
      };
    });
  };
  
  export const getProfile = async (): Promise<Omit<ProfileData, 'id'> | null> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROFILE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(PROFILE_STORE_NAME);
      const request = store.get(1); // Get the profile with the fixed ID
  
      request.onsuccess = () => {
        resolve(request.result || null);
      };
  
      request.onerror = () => {
        console.error('Get profile error:', request.error);
        reject(request.error);
      };
    });
  };
