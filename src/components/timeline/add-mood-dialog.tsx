"use client";

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Smile, Laugh, Frown, Angry, Meh } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TimelineEvent } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AddMoodDialogProps {
  onAddEvent?: (event: Omit<TimelineEvent, 'id' | 'time' | 'icon'>) => void;
  trigger: ReactNode;
}

const moods = [
  { name: "Heureux", icon: Laugh, color: "text-green-500" },
  { name: "Bien", icon: Smile, color: "text-lime-500" },
  { name: "Neutre", icon: Meh, color: "text-yellow-500" },
  { name: "Triste", icon: Frown, color: "text-blue-500" },
  { name: "En colère", icon: Angry, color: "text-red-500" },
];

export function AddMoodDialog({ onAddEvent, trigger }: AddMoodDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMood) {
        toast({ variant: "destructive", title: "Veuillez sélectionner une humeur."});
        return;
    }
    
    console.log({ mood: selectedMood });

    setOpen(false);
    setSelectedMood(null);
    toast({ title: "Humeur enregistrée (dans la console) !" });
  };
  
  const cleanup = () => {
    setSelectedMood(null);
  }

  return (
      <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if(!isOpen) cleanup();
      }}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
         <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle>Comment vous sentez-vous ?</DialogTitle>
          </DialogHeader>
            <div className="py-4">
              <div className="flex justify-around">
                {moods.map(mood => {
                  const Icon = mood.icon;
                  return (
                    <div 
                      key={mood.name} 
                      className="flex flex-col items-center gap-2 cursor-pointer"
                      onClick={() => setSelectedMood(mood.name)}
                    >
                      <div className={cn("p-3 rounded-full transition-colors", selectedMood === mood.name ? 'bg-primary/20' : 'bg-muted')}>
                        <Icon className={cn("w-8 h-8", mood.color)} />
                      </div>
                      <span className={cn("text-xs", selectedMood === mood.name ? "text-primary font-bold" : "text-muted-foreground")}>{mood.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Fermer</Button>
                </DialogClose>
                <Button type="submit" disabled={!selectedMood}>Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}
