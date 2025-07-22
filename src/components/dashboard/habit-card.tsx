"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Habit } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface HabitCardProps {
  habit: Habit;
}

export function HabitCard({ habit }: HabitCardProps) {
  const [completed, setCompleted] = useState(habit.completed);
  const Icon = habit.icon;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-lg hover:-translate-y-1",
        completed ? "bg-card/60 opacity-70" : "bg-card"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium font-headline">{habit.name}</CardTitle>
        <div className="p-2 bg-accent/20 rounded-lg">
          <Icon className="h-5 w-5 text-accent-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          {habit.description}
        </div>
        <div className="flex items-center space-x-2 pt-2 border-t border-dashed">
          <Checkbox
            id={`habit-${habit.id}`}
            checked={completed}
            onCheckedChange={() => setCompleted(!completed)}
            aria-label={`Marquer ${habit.name} comme fait`}
          />
          <label
            htmlFor={`habit-${habit.id}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {completed ? "Terminé !" : "Marquer comme fait"}
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
