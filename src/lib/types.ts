import type { LucideIcon } from "lucide-react";

export interface Habit {
  id: string;
  name: string;
  icon: LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  completed: boolean;
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
