import type { LucideIcon } from "lucide-react";
import { Droplet, Eye } from 'lucide-react';
import { LungsIcon } from '@/components/icons/lungs-icon';
import { StretchingIcon } from '@/components/icons/stretching-icon';

type HabitIcon = {
    value: string;
    label: string;
    icon: LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export const habitIcons: HabitIcon[] = [
  { value: 'droplet', label: "Goutte d'eau", icon: Droplet },
  { value: 'stretching', label: 'Étirement', icon: StretchingIcon },
  { value: 'lungs', label: 'Respiration', icon: LungsIcon },
  { value: 'eye', label: 'Oeil', icon: Eye },
];

export const iconMap: Record<string, LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  droplet: Droplet,
  stretching: StretchingIcon,
  lungs: LungsIcon,
  eye: Eye,
};
