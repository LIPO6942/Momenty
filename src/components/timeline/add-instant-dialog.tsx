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
import { BookText, Camera, MapPin, Smile, Trash2, LocateFixed, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddInstantDialogProps {
  children: ReactNode;
}

const moods = [
  { name: "Heureux", icon: "😊" },
  { name: "Excité", icon: "🤩" },
  { name: "Émerveillé", icon: "🤯" },
  { name: "Détendu", icon: "😌" },
  { name: "Curieux", icon: "🤔" },
  { name: "Nostalgique", icon: "😢" },
];

export function AddInstantDialog({ children }: AddInstantDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { addInstant } = useContext(TimelineContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        toast({ title: "Photo prête à être ajoutée." });
      };
      reader.readAsDataURL(file);
    }
  };

  const cleanup = () => {
    setDescription("");
    setLocation("");
    setPhoto(null);
    setEmotion(null);
  }

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
        toast({ variant: "destructive", title: "La géolocalisation n'est pas supportée par votre navigateur."});
        return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                if (data.address) {
                    const city = data.address.city || data.address.town || data.address.village || '';
                    const country = data.address.country || '';
                    setLocation(`${city}, ${country}`);
                    toast({ title: "Lieu trouvé !" });
                } else {
                    toast({ variant: "destructive", title: "Impossible de déterminer le lieu." });
                }
            } catch (error) {
                console.error("Error fetching location name:", error);
                toast({ variant: "destructive", title: "Erreur de géolocalisation." });
            } finally {
                setIsLocating(false);
            }
        },
        (error) => {
            toast({ variant: "destructive", title: "Permission de localisation refusée.", description: "Vous pouvez entrer le lieu manuellement." });
            setIsLocating(false);
        }
    );
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!description) {
        toast({variant: "destructive", title: "Veuillez ajouter une description."});
        return;
    }

    const newInstant = {
      type: photo ? "photo" as const : "note" as const,
      title: description.substring(0, 30) + (description.length > 30 ? '...' : ''), // Simple title generation
      description,
      date: new Date().toISOString(),
      location: location || "Lieu inconnu",
      emotion: emotion || "Neutre",
      photo: photo
    };

    addInstant(newInstant);

    setOpen(false);
    cleanup();
    toast({ title: "Nouvel instant ajouté !" });
  };
  
  return (
      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) cleanup();
      }}>
        <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
         <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter un instant</DialogTitle>
          </DialogHeader>
            <div className="space-y-4 py-4">
                {photo && (
                    <div className="relative group">
                        <Image src={photo} alt="Aperçu" width={400} height={200} className="rounded-md object-cover w-full" />
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setPhoto(null)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                )}
                <Textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Qu'avez-vous en tête ?" 
                    required 
                    className="min-h-[100px]"
                />
                 <div className="flex items-center gap-1">
                    <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <Input 
                        name="location" 
                        placeholder="Lieu (ex: Paris, France)" 
                        className="border-0 focus-visible:ring-0 flex-grow"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={handleGetLocation} disabled={isLocating}>
                        {isLocating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LocateFixed className="h-5 w-5" />}
                    </Button>
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
            <DialogFooter className="justify-between sm:justify-between">
                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-5 w-5" />
                </Button>
                 <Input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />

                <div className="flex gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Fermer</Button>
                    </DialogClose>
                    <Button type="submit">Publier</Button>
                </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}
