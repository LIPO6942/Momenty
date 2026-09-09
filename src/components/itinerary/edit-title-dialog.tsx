"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Edit3, Loader2 } from "lucide-react";

interface EditTitleDialogProps {
  currentTitle: string;
  onSave: (newTitle: string) => Promise<void> | void;
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function EditTitleDialog({
  currentTitle,
  onSave,
  trigger,
  children,
}: EditTitleDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(currentTitle);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(currentTitle);
    }
  }, [open, currentTitle]);

  const handleSave = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await onSave(trimmed);
      setOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || children || (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Edit3 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Renommer l'itinéraire
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="itinerary-title">Nom de l'itinéraire</Label>
          <Input
            id="itinerary-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Voyage inoubliable en Italie"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSave();
              }
            }}
            autoFocus
          />
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost" disabled={isSaving}>Annuler</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
