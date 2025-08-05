"use client";

const DB_NAME = "InsTXP_DB";
const STORE_NAME = "images";
const DB_VERSION = 1;

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
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

export const saveImage = async (id: string, imageDataUrl: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
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
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
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
