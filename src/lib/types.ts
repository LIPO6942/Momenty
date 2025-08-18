

import { type ManualLocation } from "./firestore"; // Changed from idb
import type { User } from 'firebase/auth';


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
    category?: string[]; // AI-generated category, now an array
}

export interface Encounter {
    id: string;
    name: string;
    description: string;
    date: string; // ISO String
    location: string;
    emotion: string | string[];
    photo?: string | null; // Cloudinary URL
}

export interface Dish {
    id: string;
    name: string;
    description: string;
    date: string; // ISO String
    location: string;
    emotion: string | string[];
    photo?: string | null; // Cloudinary URL
}

export interface Accommodation {
    id:string;
    name: string;
    description: string;
    date: string; // ISO String
    location: string;
    emotion: string | string[];
    photo?: string | null; // Cloudinary URL
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

export interface LocationWithCoords extends ManualLocation {
    name: string;
    count: number;
    isManual: boolean;
    coords: [number, number];
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}
