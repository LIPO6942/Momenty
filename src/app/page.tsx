"use client";

import { useState } from "react";
import { AddHabitDialog } from "@/components/dashboard/add-habit-dialog";
import { HabitCard } from "@/components/dashboard/habit-card";
import type { Habit } from "@/lib/types";
import { iconMap } from "@/lib/icons";

const initialHabits: Habit[] = [
  {
    id: "1",
    name: "Boire de l'eau",
    icon: iconMap['droplet'],
    description: "Toutes les 2 heures",
    completed: true,
  },
  {
    id: "2",
    name: "S'étirer",
    icon: iconMap['stretching'],
    description: "Toutes les heures",
    completed: false,
  },
  {
    id: "3",
    name: "Respiration profonde",
    icon: iconMap['lungs'],
    description: "Toutes les 4 heures",
    completed: false,
  },
  {
    id: "4",
    name: "Reposer les yeux",
    icon: iconMap['eye'],
    description: "Toutes les 30 minutes",
    completed: true,
  },
];

export default function DashboardPage() {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);

  const handleAddHabit = (newHabit: Omit<Habit, "id" | "completed">) => {
    const habitToAdd: Habit = {
      ...newHabit,
      id: Date.now().toString(),
      completed: false,
    };
    setHabits((prevHabits) => [...prevHabits, habitToAdd]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground font-headline">Tableau de bord</h1>
        <AddHabitDialog onAddHabit={handleAddHabit} />
      </div>
      <p className="text-muted-foreground mb-8">
        Vos habitudes quotidiennes pour une vie plus saine et plus sereine.
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} />
        ))}
      </div>
    </div>
  );
}
