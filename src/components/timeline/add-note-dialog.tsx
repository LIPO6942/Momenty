"use client";

import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface AddNoteDialogProps {
  onAddEvent?: (event: Omit<TimelineEvent, 'id' | 'time' | 'icon'>) => void;
  trigger: ReactNode;
}

export function AddNoteDialog({ onAddEvent, trigger }: AddNoteDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    console.log({ title, description });

    setOpen(false);
    toast({ title: "Note ajoutée (dans la console) !" });
  };
  
  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
         <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter une note</DialogTitle>
          </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input id="title" name="title" placeholder="Ex: Idée de projet" required />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="description">Contenu de la note</Label>
                    <Textarea id="description" name="description" placeholder="Écrivez vos pensées ici..." required />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Fermer</Button>
                </DialogClose>
                <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}
