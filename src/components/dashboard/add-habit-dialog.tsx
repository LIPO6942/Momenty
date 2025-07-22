"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Habit } from "@/lib/types";
import { habitIcons, iconMap } from "@/lib/icons";

interface AddHabitDialogProps {
  onAddHabit: (newHabit: Omit<Habit, "id" | "completed">) => void;
}

export function AddHabitDialog({ onAddHabit }: AddHabitDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const iconKey = formData.get("icon") as string;
    const frequency = formData.get("frequency") as string || "1";
    const unit = formData.get("unit") as string;

    const unitTranslations: Record<string, string> = {
      minutes: 'minutes',
      hours: 'heures',
      days: 'jours'
    }

    if (!name || !iconKey || !unit) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
      });
      return;
    }

    const newHabit = {
      name,
      icon: iconMap[iconKey],
      description: `Toutes les ${frequency} ${unitTranslations[unit] || unit}`,
    };

    onAddHabit(newHabit);

    toast({
      title: "Habitude ajoutée !",
      description: `L'habitude "${name}" a été ajoutée à votre liste.`,
    });
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une habitude
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle habitude</DialogTitle>
            <DialogDescription>
              Personnalisez votre nouvelle habitude pour commencer à la suivre.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input id="name" name="name" placeholder="Ex: Méditer" className="col-span-3" required/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">
                Icône
              </Label>
              <Select name="icon" required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Choisir une icône" />
                </SelectTrigger>
                <SelectContent>
                  {habitIcons.map(({ value, label, icon: Icon }) => (
                     <SelectItem key={value} value={value}>
                       <div className="flex items-center gap-2">
                         <Icon className="h-4 w-4 text-muted-foreground" />
                         <span>{label}</span>
                       </div>
                     </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="frequency" className="text-right">
                Fréquence
              </Label>
              <Input id="frequency" name="frequency" type="number" defaultValue="1" min="1" className="col-span-1" required/>
              <Select name="unit" defaultValue="hours" required>
                <SelectTrigger className="col-span-2">
                  <SelectValue placeholder="Unité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minutes">Minutes</SelectItem>
                  <SelectItem value="hours">Heures</SelectItem>
                  <SelectItem value="days">Jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Annuler</Button>
            </DialogClose>
            <Button type="submit">Enregistrer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
