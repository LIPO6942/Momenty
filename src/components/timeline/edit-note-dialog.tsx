

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
import { Image as ImageIcon, MapPin, Trash2, CalendarIcon, Wand2, Loader2 } from "lucide-react";
import { Separator } from "../ui/separator";
import { format, parseISO } from "date-fns";
import { describePhoto } from "@/ai/flows/describe-photo-flow";

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
  const [emotions, setEmotions] = useState<string[]>(Array.isArray(instantToEdit.emotion) ? instantToEdit.emotion : (instantToEdit.emotion ? [instantToEdit.emotion] : []));
  const [date, setDate] = useState(instantToEdit.date);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzePhoto = async (photoDataUri: string) => {
    setIsAnalyzing(true);
    try {
        const result = await describePhoto({ photoDataUri });
        if (result.description) {
            setDescription(prev => prev ? `${prev}\n\n${result.description}` : result.description);
        }
        if (result.location && !location) { // Only set location if it was empty
            setLocation(result.location);
        }
        toast({ title: "Analyse IA terminée." });
    } catch(e) {
        console.error(e);
        toast({ variant: "destructive", title: "L'analyse par IA a échoué."});
    } finally {
        setIsAnalyzing(false);
    }
  }

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const finalDescription = description || "Note";

    // Call the context function to update the instant
    updateInstant(instantToEdit.id, {
      title: finalDescription.substring(0, 30) + (finalDescription.length > 30 ? '...' : ''),
      description,
      photo,
      location,
      emotion: emotions.length > 0 ? emotions : ["Neutre"],
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
    setEmotions(Array.isArray(instantToEdit.emotion) ? instantToEdit.emotion : (instantToEdit.emotion ? [instantToEdit.emotion] : []));
    setDate(instantToEdit.date);
    setIsAnalyzing(false);
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
                                <Button type="button" variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleAnalyzePhoto(photo as string)} disabled={isAnalyzing}>
                                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4"/>}
                                </Button>
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
                    <Input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                 </div>
                 
                 <Separator />

                 <div>
                    <Label className="text-muted-foreground flex items-center gap-2">
                        Qu'avez-vous en tête ?
                        {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                    </Label>
                    <Textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez votre moment..." 
                        className="min-h-[100px] mt-2"
                        disabled={isAnalyzing}
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
                            disabled={isAnalyzing}
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
                             disabled={isAnalyzing}
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
                                disabled={isAnalyzing}
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
                <Button type="submit" disabled={isAnalyzing}>
                  {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}
