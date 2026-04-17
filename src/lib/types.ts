
import { type ManualLocation } from "./firestore"; // Changed from idb
import type { User } from 'firebase/auth';

export interface DisplayTransform {
    preset: 'landscape' | 'portrait' | 'square';
    crop: 'fill' | 'fit';
    gravity: 'auto' | 'center' | 'custom';
    positionX?: number; // 0-100 percentage
    positionY?: number; // 0-100 percentage
}

// --- Itinerary Flow Types ---

export interface Activity {
    time: string;
    description: string;
    type: "Musée" | "Monument" | "Restaurant" | "Activité" | "Parc" | "Shopping" | "Soirée" | "Baignade" | "Autre";
}

export interface TravelInfo {
    mode: "Train" | "Avion" | "Voiture" | "Bus" | "Bateau";
    description: string;
}

export interface DayPlan {
    day: number;
    date: string;
    city: string;
    theme: string;
    activities: Activity[];
    travelInfo?: TravelInfo; // Optional travel info for the end of the day
}

export interface ItineraryOutput {
    title: string;
    itinerary: DayPlan[];
}


// --- Main App Types ---

export interface CollageSlot {
    slotIndex: number;
    photoUrl: string; // Cloudinary URL after upload
}

export interface CollageTemplate {
    templateId: string; // e.g. 'side-by-side', 'large-left-2', etc.
    ratio: '1:1' | '4:5' | '16:9' | '9:16' | '2:3' | '3:2' | '3:4' | '21:9' | '1:1.414';
    gap: number;          // 0–12px
    borderRadius: number; // 0–20px
    bgColor: string;      // '#000000' by default
    bgPattern?: string;   // 'none', 'dots', 'grid', 'paper', etc.
    photoFrame?: 'none' | 'polaroid' | 'classic' | 'clean' | 'mosaic' | 'minimal';
    photoTilt?: boolean;
    layoutStyle?: 'smart' | 'classic' | 'masonry';
    slots: CollageSlot[];
}

export type ArtisticStyleType = 'manga' | 'abstract' | 'vangogh' | 'monet' | 'watercolor' | 'comic';

export type ArtisticModeType = 'faithful' | 'creative';

export interface ArtisticStyle {
    style: ArtisticStyleType;
    mode?: ArtisticModeType;
    artisticUrl: string; // URL de l'image générée par DeepAI
}

export interface Instant {
    id: string;
    type: 'note' | 'photo' | 'video' | 'audio' | 'mood';
    title: string;
    description: string;
    date: string; // ISO String
    icon?: React.ReactNode;
    color?: string;
    location: string;
    emotion: string | string[];
    photos?: string[] | null; // Now these will be Cloudinary URLs
    audio?: string | null; // Cloudinary URL for audio memory
    category?: string[]; // AI-generated category, now an array
    displayTransform?: DisplayTransform; // Optional persisted display settings
    collageTemplate?: CollageTemplate; // Optional collage template settings
    descriptionStyle?: 'classique-italique' | 'magazine-bold' | 'polaroid-marker' | 'cinematique'; // Optional style for description overlay
    artisticStyle?: ArtisticStyle; // Optional artistic transformation for the main photo
}

export interface Encounter {
    id: string;
    name: string;
    description: string;
    date: string; // ISO String
    location: string;
    emotion: string | string[];
    photo?: string | null; // Cloudinary URL
    audio?: string | null; // Cloudinary URL for audio memory
    displayTransform?: DisplayTransform; // Optional persisted display settings
}

export interface Dish {
    id: string;
    name: string;
    description: string;
    date: string; // ISO String
    location: string;
    city?: string; // Zone/City name
    emotion: string | string[];
    photo?: string | null; // Cloudinary URL
    audio?: string | null; // Cloudinary URL for audio memory
    displayTransform?: DisplayTransform; // Optional persisted display settings
}

export interface Accommodation {
    id: string;
    name: string;
    description: string;
    date: string; // ISO String
    location: string;
    emotion: string | string[];
    photo?: string | null; // Cloudinary URL
    audio?: string | null; // Cloudinary URL for audio memory
    displayTransform?: DisplayTransform; // Optional persisted display settings
}

export interface CityWithDays {
    name: string;
    days: number;
}

export interface Trip {
    location?: string;
    citiesToVisit?: CityWithDays[];
    startDate?: string; // ISO String
    endDate?: string; // ISO String
    companionType?: 'Ami(e)' | 'Conjoint(e)' | 'Parent' | 'Solo' | string;
    companionName?: string;
}

export interface Itinerary extends ItineraryOutput, Trip {
    id?: string;
    userId: string;
    createdAt: string; // ISO String
    shareEnabled?: boolean;
    shareToken?: string;
    sharedAt?: string; // ISO String
}


export interface TimelineEvent {
    id: string;
    title: string;
    description: string;
    date: string; // ISO String
    icon: React.ReactNode;
    color: string;
}

export interface TimelineEventPhoto {
    id: string;
    imageUrl: string;
    title: string;
    description: string;
    dateTaken: string; // ISO string format
}

export interface GeneratedStory {
    id: string; // Can be a single day 'yyyy-MM-dd' or a composite key 'day1_day2'
    date: string; // The first day string 'yyyy-MM-dd' for sorting purposes
    title: string;
    story: string;
    instants: Omit<Instant, 'icon' | 'color'>[]; // The instants used to generate the story
}

export interface AppNotification {
    id: string;
    type: 'itinerary_share';
    senderId: string;
    senderName: string;
    itineraryId: string;
    itineraryTitle: string;
    shareToken: string;
    createdAt: string;
    read: boolean;
}

export interface LocationWithCoords extends ManualLocation {
    name: string;
    count: number;
    isManual: boolean;
    coords: [number, number];
    instants?: Instant[]; // Timeline instants associated with this location
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (email: string, pass: string, displayName?: string) => Promise<void>;
    logout: () => Promise<void>;
    updateProfile: (data: { displayName?: string, fcmToken?: string, notificationsEnabled?: boolean }) => Promise<void>;
}
