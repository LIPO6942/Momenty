"use client";

import { useState, ReactNode, useContext, useRef } from "react";
import Image from "next/image";
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
import { saveImage, getImage } from "@/lib/idb";
import { Camera, Trash2 } from "lucide-react";

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
  const [photo, setPhoto] = useState<string | null | undefined>(instantToEdit.photo);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let photoUrl = photo;
    if (photo && photo.startsWith('blob:')) {
       // Should not happen with current logic, but as a safeguard
       photoUrl = instantToEdit.photo; // Keep old photo if new one is not a data URL
    }
   
    updateInstant(instantToEdit.id, {
      title,
      description,
      photo: photoUrl,
    });

    setOpen(false);
    toast({ title: "Instant mis à jour !" });
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        try {
          await saveImage(instantToEdit.id, result);
          setPhoto(result);
          toast({title: "Photo ajoutée localement."});
        } catch (error) {
          console.error("Failed to save image to IndexedDB", error);
          toast({variant: "destructive", title: "Erreur de sauvegarde de l'image"});
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = async () => {
    try {
        await saveImage(instantToEdit.id, ''); // "Delete" by saving an empty string
        setPhoto(null);
        toast({title: "Photo supprimée."});
    } catch(error) {
        console.error("Failed to remove image", error);
        toast({variant: "destructive", title: "Erreur de suppression de l'image"});
    }
  }

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

                <div className="grid gap-2">
                  <Label>Photo</Label>
                  {photo ? (
                    <div className="relative group">
                       <Image src={photo} alt="Aperçu" width={400} height={200} className="rounded-md object-cover" />
                       <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleRemovePhoto}>
                          <Trash2 className="h-4 w-4"/>
                       </Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Camera className="mr-2 h-4 w-4" />
                      Ajouter une photo
                    </Button>
                  )}
                  <Input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
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
