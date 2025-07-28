"use client";

import { useState, ReactNode, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { TimelineContext } from "@/context/timeline-context";
import { BookText } from "lucide-react";

interface AddNoteDialogProps {
  trigger: ReactNode;
}

export function AddNoteDialog({ trigger }: AddNoteDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { addEvent } = useContext(TimelineContext);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    const newEvent = {
      title,
      description,
      date: new Date().toISOString(),
      icon: <BookText className="h-4 w-4 text-purple-700" />,
      color: 'bg-purple-400',
    };

    addEvent(newEvent);

    setOpen(false);
    toast({ title: "Note ajoutée à votre timeline !" });
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
