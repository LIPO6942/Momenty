
const DB_NAME = 'MomentyOfflineSync';
const OS_NAME = 'media_queue';
const DB_VERSION = 1;

export interface QueuedMedia {
    id: string;
    data: string | Blob;
    collection: 'instants' | 'encounters' | 'dishes' | 'accommodations';
    docId: string;
    fieldName: string; // e.g., 'photos' or 'photo' or 'audio'
    mediaType: 'image' | 'audio';
}

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(OS_NAME)) {
                db.createObjectStore(OS_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const queueMediaForUpload = async (media: Omit<QueuedMedia, 'id'>): Promise<string> => {
    const db = await openDB();
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(OS_NAME, 'readwrite');
        const store = transaction.objectStore(OS_NAME);
        const request = store.add({ ...media, id });
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

export const getPendingMedia = async (): Promise<QueuedMedia[]> => {
    if (typeof indexedDB === 'undefined') return [];
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(OS_NAME, 'readonly');
            const store = transaction.objectStore(OS_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("Failed to open IndexedDB", e);
        return [];
    }
};

export const removeFromQueue = async (id: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(OS_NAME, 'readwrite');
        const store = transaction.objectStore(OS_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
