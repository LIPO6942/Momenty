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
import type { Instant } from "@/lib/types";

interface EditNoteDialogProps {
  children: ReactNode;
  instantToEdit: Instant;
}

export function EditNoteDialog({ children, instantToEdit }: EditNoteDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { updateInstant } = useContext(TimelineContext);
  
  const [title, setTitle] = useState(instantToEdit.title);
  const [description, setDescription] = useState(instantToEdit.description);

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
   
    updateInstant(instantToEdit.id, {
      title,
      description,
    });

    setOpen(false);
    toast({ title: "Instant mis à jour !" });
  };
  
  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
         <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier l'instant</DialogTitle>
          </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input 
                      id="title" 
                      name="title" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required 
                    />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="description">Contenu</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required 
                    />
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
