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
    time: string;
    icon: React.ReactNode;
    description: string;
}

export interface TimelineEventPhoto {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  dateTaken: string; // ISO string format
}
