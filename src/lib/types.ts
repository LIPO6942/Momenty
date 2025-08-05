export interface Instant {
    id: string;
    type: 'note' | 'photo' | 'video' | 'audio' | 'mood';
    title: string;
    description: string;
    date: string; // ISO String
    icon: React.ReactNode;
    color: string;
    location: string;
    emotion: string;
    photo?: string | null; // Data URL for the image
    category?: string; // AI-generated category
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
}
