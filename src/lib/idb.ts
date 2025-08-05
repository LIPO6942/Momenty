
"use client";
import type { GeneratedStory } from './types';

const DB_NAME = "InsTXP_DB";
const IMAGE_STORE_NAME = "images";
const STORY_STORE_NAME = "stories";
const DB_VERSION = 2; // Incremented version for schema change

let db: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

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
      if (!dbInstance.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        dbInstance.createObjectStore(IMAGE_STORE_NAME, { keyPath: "id" });
      }
      if (!dbInstance.objectStoreNames.contains(STORY_STORE_NAME)) {
        dbInstance.createObjectStore(STORY_STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

// Image functions
export const saveImage = async (id: string, imageDataUrl: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IMAGE_STORE_NAME], "readwrite");
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.put({ id: id, image: imageDataUrl });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      console.error("Save image error:", request.error);
      reject(request.error);
    };
  });
};

export const getImage = async (id: string): Promise<string | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([IMAGE_STORE_NAME], "readonly");
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result.image);
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      console.error("Get image error:", request.error);
      reject(request.error);
    };
  });
};


// Story functions
export const saveStory = async (story: GeneratedStory): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORY_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORY_STORE_NAME);
        const request = store.put(story);

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Save story error:', request.error);
            reject(request.error);
        };
    });
};

export const getStories = async (): Promise<GeneratedStory[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORY_STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORY_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const sortedStories = request.result.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            resolve(sortedStories);
        };
        request.onerror = () => {
            console.error('Get stories error:', request.error);
            reject(request.error);
        };
    });
};

export const deleteStory = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORY_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORY_STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Delete story error:', request.error);
            reject(request.error);
        };
    });
};
