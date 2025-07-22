import type { LucideIcon } from "lucide-react";

export interface Habit {
  id: string;
  name: string;
  icon: LucideIcon | React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  completed: boolean;
}
