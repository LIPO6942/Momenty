
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
import { ScrollArea } from "../ui/scroll-area";
import { Image as ImageIcon, MapPin, Trash2, CalendarIcon } from "lucide-react";
import { Separator } from "../ui/separator";
import { format, parseISO } from "date-fns";

interface EditNoteDialogProps {
  children: ReactNode;
  instantToEdit: Instant;
}

const moods = [
  { name: "Heureux", icon: "😊" },
  { name: "Excité", icon: "🤩" },
  { name: "Émerveillé", icon: "🤯" },
  { name: "Détendu", icon: "😌" },
  { name: "Curieux", icon: "🤔" },
  { name: "Nostalgique", icon: "😢" },
];

// Helper to format ISO string to datetime-local string
const toDateTimeLocal = (isoString: string) => {
    try {
        const date = parseISO(isoString);
        // Format to "yyyy-MM-ddTHH:mm"
        return format(date, "yyyy-MM-dd'T'HH:mm");
    } catch (error) {
        console.error("Invalid date format:", isoString, error);
        return ""; // Fallback to empty string
    }
};


export function EditNoteDialog({ children, instantToEdit }: EditNoteDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { updateInstant } = useContext(TimelineContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize state with values from the instant to be edited
  const [description, setDescription] = useState(instantToEdit.description);
  const [location, setLocation] = useState(instantToEdit.location);
  const [photo, setPhoto] = useState<string | null | undefined>(instantToEdit.photo);
  const [emotion, setEmotion] = useState<string | null>(instantToEdit.emotion);
  const [date, setDate] = useState(instantToEdit.date);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const finalDescription = description || "Note";

    // Call the context function to update the instant
    updateInstant(instantToEdit.id, {
      title: finalDescription.substring(0, 30) + (finalDescription.length > 30 ? '...' : ''),
      description,
      photo,
      location,
      emotion: emotion || "Neutre",
      date: new Date(date).toISOString(), // Ensure date is in ISO format
    });

    setOpen(false); // Close the dialog
    toast({ title: "Instant mis à jour !" });
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        toast({title: "Photo mise à jour."});
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to reset state when the dialog is closed without saving
  const cleanup = () => {
    setDescription(instantToEdit.description);
    setLocation(instantToEdit.location);
    setPhoto(instantToEdit.photo);
    setEmotion(instantToEdit.emotion);
    setDate(instantToEdit.date);
  }

  return (
      <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if(!isOpen) cleanup(); // Reset state if dialog is closed
      }}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
         <form onSubmit={handleFormSubmit} className="flex flex-col overflow-hidden h-full">
          <DialogHeader className="shrink-0">
            <DialogTitle>Modifier l'instant</DialogTitle>
          </DialogHeader>
           <div className="flex-grow overflow-y-auto pr-6 -mr-6">
             <div className="space-y-6 py-4">
                 <div className="space-y-2">
                    <Label className="text-muted-foreground">Souvenir visuel</Label>
                    {photo ? (
                        <div className="relative group">
                            <Image src={photo} alt="Aperçu" width={400} height={800} className="rounded-md object-cover w-full h-auto max-h-[40vh]" />
                            <div className="absolute top-2 right-2 flex gap-2">
                                <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => setPhoto(null)}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    ) : (
                       <Button type="button" variant="outline" className="w-full h-20 flex-col gap-2" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon className="h-6 w-6" />
                            <span>Importer une nouvelle photo</span>
                        </Button>
                    )}
                    <Input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                 </div>
                 
                 <Separator />

                 <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                        Qu'avez-vous en tête ?
                    </Label>
                    <Textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez votre moment..." 
                        className="min-h-[100px] mt-2"
                    />
                 </div>

                 <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                        Date et heure
                    </Label>
                    <div className="flex items-center gap-1 mt-2">
                       <CalendarIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <Input
                            type="datetime-local"
                            value={toDateTimeLocal(date)}
                            onChange={(e) => setDate(e.target.value)}
                            className="border-0 focus-visible:ring-0 flex-grow"
                        />
                    </div>
                 </div>

                 <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                        Où étiez-vous ?
                    </Label>
                    <div className="flex items-center gap-1 mt-2">
                        <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        <Input 
                            name="location" 
                            placeholder="Lieu (ex: Paris, France)" 
                            className="border-0 focus-visible:ring-0 flex-grow"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>
                 </div>
                 <div className="pt-2">
                    <Label className="text-muted-foreground">Quelle était votre humeur ?</Label>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {moods.map(mood => (
                            <Button 
                                key={mood.name} 
                                type="button" 
                                variant={emotion === mood.name ? "default" : "outline"}
                                size="sm"
                                onClick={() => setEmotion(mood.name)}
                                className="rounded-full"
                            >
                                {mood.icon} {mood.name}
                            </Button>
                        ))}
                    </div>
                 </div>
               </div>
           </div>
            <DialogFooter className="pt-4 mt-auto shrink-0">
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
