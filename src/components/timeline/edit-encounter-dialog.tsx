

"use client";

import { useState, ReactNode, useContext, useRef, useEffect } from "react";
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
import type { Encounter } from "@/lib/types";
import { Image as ImageIcon, MapPin, Trash2, CalendarIcon, Wand2, Loader2 } from "lucide-react";
import { Separator } from "../ui/separator";
import { format, parseISO, isValid } from "date-fns";


// Helper to format ISO string to datetime-local string
const toDateTimeLocal = (isoString: string) => {
    if (!isoString) return "";
    try {
        const date = parseISO(isoString);
        if (isValid(date)) {
            // Format to "yyyy-MM-ddTHH:mm"
            return format(date, "yyyy-MM-dd'T'HH:mm");
        }
        return "";
    } catch (error) {
        console.error("Invalid date format for parsing:", isoString, error);
        return ""; // Fallback to empty string
    }
};

const moods = [
    { name: "Heureux", icon: "😊" },
    { name: "Excité", icon: "🤩" },
    { name: "Émerveillé", icon: "🤯" },
    { name: "Détendu", icon: "😌" },
    { name: "Curieux", icon: "🤔" },
    { name: "Nostalgique", icon: "😢" },
];

interface EditEncounterDialogProps {
  children?: ReactNode;
  encounterToEdit: Encounter;
}

export function EditEncounterDialog({ children, encounterToEdit }: EditEncounterDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { updateEncounter } = useContext(TimelineContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize state with values from the encounter to be edited
  const [name, setName] = useState(encounterToEdit.name);
  const [description, setDescription] = useState(encounterToEdit.description);
  const [location, setLocation] = useState(encounterToEdit.location);
  const [photo, setPhoto] = useState<string | null | undefined>(encounterToEdit.photo);
  const [emotions, setEmotions] = useState<string[]>(Array.isArray(encounterToEdit.emotion) ? encounterToEdit.emotion : (encounterToEdit.emotion ? [encounterToEdit.emotion] : []));
  const [date, setDate] = useState(encounterToEdit.date);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (open && encounterToEdit) {
        setName(encounterToEdit.name);
        setDescription(encounterToEdit.description);
        setLocation(encounterToEdit.location);
        setPhoto(encounterToEdit.photo);
        setEmotions(Array.isArray(encounterToEdit.emotion) ? encounterToEdit.emotion : (encounterToEdit.emotion ? [encounterToEdit.emotion] : []));
        setDate(encounterToEdit.date);
    }
  }, [open, encounterToEdit]);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const dateToSave = new Date(date);
    if (!isValid(dateToSave)) {
        toast({
            variant: "destructive",
            title: "Date invalide",
            description: "Veuillez entrer une date et une heure valides.",
        });
        setIsLoading(false);
        return;
    }

    try {
        let uploadedPhotoUrl = photo;
        if (photo && photo.startsWith('data:')) {
             const formData = new FormData();
             const blob = await (await fetch(photo)).blob();
             formData.append('file', blob);
             const response = await fetch('/api/upload', {
                 method: 'POST',
                 body: formData,
             });
             const result = await response.json();
             uploadedPhotoUrl = result.secure_url;
        }

        await updateEncounter(encounterToEdit.id, {
            name,
            description,
            photo: uploadedPhotoUrl,
            location,
            emotion: emotions.length > 0 ? emotions : ["Neutre"],
            date: dateToSave.toISOString(),
        });
        
        setOpen(false);
        toast({ title: "Rencontre mise à jour !" });

    } catch(error) {
        console.error("Failed to update encounter", error);
        toast({ variant: "destructive", title: "Erreur de mise à jour" });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      let processingFile: File | Blob = file;
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        setIsConverting(true);
        toast({ title: "Conversion de l'image HEIC..." });
        try {
          const heic2any = (await import('heic2any')).default;
          const convertedBlob = await heic2any({
            blob: file,
            toType: "image/jpeg",
          });
          processingFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        } catch (error) {
          console.error('HEIC Conversion Error:', error);
          toast({ variant: "destructive", title: "Erreur de conversion", description: "Impossible de convertir l'image HEIC." });
          setIsConverting(false);
          return;
        } finally {
          setIsConverting(false);
        }
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        toast({title: "Photo prête à être téléversée."});
      };
      reader.readAsDataURL(processingFile);
    }
  };

  const cleanup = () => {
    if (encounterToEdit) {
        setName(encounterToEdit.name);
        setDescription(encounterToEdit.description);
        setLocation(encounterToEdit.location);
        setPhoto(encounterToEdit.photo);
        setEmotions(Array.isArray(encounterToEdit.emotion) ? encounterToEdit.emotion : (encounterToEdit.emotion ? [encounterToEdit.emotion] : []));
        setDate(encounterToEdit.date);
    }
    setIsLoading(false);
  }

  const handleToggleEmotion = (moodName: string) => {
    setEmotions(prev => 
        prev.includes(moodName) 
            ? prev.filter(m => m !== moodName) 
            : [...prev, moodName]
    );
  };

  return (
      <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if(!isOpen) cleanup();
      }}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
         <form onSubmit={handleFormSubmit} className="flex flex-col overflow-hidden h-full">
          <DialogHeader className="shrink-0">
            <DialogTitle>Modifier la rencontre</DialogTitle>
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
                       <Button type="button" variant="outline" className="w-full h-20 flex-col gap-2" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isConverting}>
                            {isConverting ? <Loader2 className="h-6 w-6 animate-spin"/> : <ImageIcon className="h-6 w-6" />}
                            <span>{isConverting ? "Conversion..." : "Importer une nouvelle photo"}</span>
                        </Button>
                    )}
                    <Input type="file" accept="image/*,.heic,.heif" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                 </div>
                 
                 <Separator />
                
                 <div className="space-y-2">
                    <Label htmlFor="name">Nom de la personne</Label>
                    <Input 
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ex: Alex"
                        disabled={isLoading}
                    />
                 </div>


                 <div>
                    <Label htmlFor="description" className="text-muted-foreground">
                        Racontez la rencontre...
                    </Label>
                    <Textarea 
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez votre moment..." 
                        className="min-h-[100px] mt-1"
                        disabled={isLoading}
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
                            disabled={isLoading}
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
                            disabled={isLoading}
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
                                variant={emotions.includes(mood.name) ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleToggleEmotion(mood.name)}
                                className="rounded-full"
                                disabled={isLoading}
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
                <Button type="submit" disabled={isLoading || isConverting}>
                  {(isLoading || isConverting) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}
