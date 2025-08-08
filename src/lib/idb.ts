
"use client";
import type { GeneratedStory, Instant, Encounter } from './types';

const DB_NAME = "Momenty_DB";
const IMAGE_STORE_NAME = "images";
const STORY_STORE_NAME = "stories";
const INSTANT_STORE_NAME = "instants";
const PROFILE_STORE_NAME = "profile";
const MANUAL_LOCATIONS_STORE_NAME = "manualLocations";
const ENCOUNTERS_STORE_NAME = "encounters";
const DB_VERSION = 6; // Incremented version for schema change

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
      if (!dbInstance.objectStoreNames.contains(INSTANT_STORE_NAME)) {
        dbInstance.createObjectStore(INSTANT_STORE_NAME, { keyPath: "id" });
      }
      if (!dbInstance.objectStoreNames.contains(PROFILE_STORE_NAME)) {
        dbInstance.createObjectStore(PROFILE_STORE_NAME, { keyPath: "id" });
      }
      if (!dbInstance.objectStoreNames.contains(MANUAL_LOCATIONS_STORE_NAME)) {
        dbInstance.createObjectStore(MANUAL_LOCATIONS_STORE_NAME, { keyPath: "id" });
      }
      if (!dbInstance.objectStoreNames.contains(ENCOUNTERS_STORE_NAME)) {
        dbInstance.createObjectStore(ENCOUNTERS_STORE_NAME, { keyPath: "id" });
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

export const deleteImage = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([IMAGE_STORE_NAME], "readwrite");
        const store = transaction.objectStore(IMAGE_STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error("Delete image error:", request.error);
            reject(request.error);
        };
    });
}


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


// Instant functions
export const getInstants = async (): Promise<Instant[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([INSTANT_STORE_NAME], 'readonly');
        const store = transaction.objectStore(INSTANT_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const sortedInstants = request.result.sort((a: Instant, b: Instant) => new Date(b.date).getTime() - new Date(a.date).getTime());
            resolve(sortedInstants);
        };
        request.onerror = () => {
            console.error('Get instants error:', request.error);
            reject(request.error);
        };
    });
}

export const saveInstant = async (instant: Instant): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([INSTANT_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(INSTANT_STORE_NAME);
        const request = store.put(instant);

        request.onsuccess = () => resolve();
        request.onerror = (event) => {
            console.error('Save instant error:', request.error);
            reject(request.error);
        };
    });
}

export const deleteInstantFromDB = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([INSTANT_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(INSTANT_STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Delete instant error:', request.error);
            reject(request.error);
        };
    });
};

// Encounter functions
export const saveEncounter = async (encounter: Encounter): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([ENCOUNTERS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(ENCOUNTERS_STORE_NAME);
        const request = store.put(encounter);
        request.onsuccess = () => resolve();
        request.onerror = () => {
            console.error('Save encounter error:', request.error);
            reject(request.error);
        };
    });
};

export const getEncounters = async (): Promise<Encounter[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([ENCOUNTERS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(ENCOUNTERS_STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => {
            const sortedEncounters = request.result.sort((a: Encounter, b: Encounter) => new Date(b.date).getTime() - new Date(a.date).getTime());
            resolve(sortedEncounters);
        };
        request.onerror = () => {
            console.error('Get encounters error:', request.error);
            reject(request.error);
        };
    });
};

export const deleteEncounter = async (id: string): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction([ENCOUNTERS_STORE_NAME, IMAGE_STORE_NAME], 'readwrite');
    const encountersStore = transaction.objectStore(ENCOUNTERS_STORE_NAME);
    const imagesStore = transaction.objectStore(IMAGE_STORE_NAME);

    return new Promise((resolve, reject) => {
        const getRequest = encountersStore.get(id);
        
        getRequest.onsuccess = () => {
            const encounter = getRequest.result;
            if (encounter && encounter.photo) {
                // Photo reference exists, so delete it from the images store
                imagesStore.delete(encounter.photo);
            }

            // Now, delete the encounter record itself
            const deleteEncounterRequest = encountersStore.delete(id);
            deleteEncounterRequest.onsuccess = () => resolve();
            deleteEncounterRequest.onerror = () => {
                 console.error('Delete encounter record error:', deleteEncounterRequest.error);
                 reject(deleteEncounterRequest.error)
            };
        };
        
        getRequest.onerror = () => {
            console.error('Get encounter for deletion error:', getRequest.error);
            reject(getRequest.error);
        };
    });
};


// Profile Functions
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
  
  // Manual Locations Functions
  export const saveManualLocations = async (locations: ManualLocation[]): Promise<void> => {
    const db = await initDB();
    const transaction = db.transaction([MANUAL_LOCATIONS_STORE_NAME, IMAGE_STORE_NAME], 'readwrite');
    const locationsStore = transaction.objectStore(MANUAL_LOCATIONS_STORE_NAME);
    const imagesStore = transaction.objectStore(IMAGE_STORE_NAME);
  
    // Process photos for all locations
    const processedLocations = await Promise.all(locations.map(async (loc) => {
      if (loc.photos && loc.photos.length > 0) {
        const photoKeys = await Promise.all(loc.photos.map(async (photoData, index) => {
          if (photoData.startsWith('data:')) { // It's a new Data URL
            const photoKey = `location_${loc.name}_${Date.now()}_${index}`;
            await new Promise<void>((res, rej) => {
              const req = imagesStore.put({ id: photoKey, image: photoData });
              req.onsuccess = () => res();
              req.onerror = () => rej(req.error);
            });
            return photoKey;
          }
          return photoData; // It's an existing key
        }));
        return { ...loc, photos: photoKeys };
      }
      return loc;
    }));
  
    return new Promise((resolve, reject) => {
      const request = locationsStore.put({ id: 1, locations: processedLocations });
      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Save locations error:', request.error);
        reject(request.error);
      };
    });
  };
  
  export const getManualLocations = async (): Promise<ManualLocation[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([MANUAL_LOCATIONS_STORE_NAME], 'readonly');
      const store = transaction.objectStore(MANUAL_LOCATIONS_STORE_NAME);
      const request = store.get(1); // Get the locations with the fixed ID
  
      request.onsuccess = () => {
        resolve(request.result ? request.result.locations : []);
      };
  
      request.onerror = () => {
        console.error('Get locations error:', request.error);
        reject(request.error);
      };
    });
  };
