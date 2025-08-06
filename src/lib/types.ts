
import { type ManualLocation } from "./idb";

export interface Instant {
    id: string;
    type: 'note' | 'photo' | 'video' | 'audio' | 'mood';
    title: string;
    description: string;
    date: string; // ISO String
    icon?: React.ReactNode; 
    color?: string;
    location: string;
    emotion: string;
    photo?: string | null; // Data URL for the image or a reference string like "local_..."
    category?: string; // AI-generated category
}

export interface Trip {
    location?: string;
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
  id: string; // Typically the day string 'yyyy-MM-dd'
  date: string; // The day string 'yyyy-MM-dd'
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
