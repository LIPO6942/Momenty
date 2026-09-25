

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
import type { Accommodation, DisplayTransform } from "@/lib/types";
import { InteractiveImageFrame } from "@/components/timeline/interactive-image-frame";
import { Image as ImageIcon, MapPin, Trash2, CalendarIcon, Wand2, Loader2, Plus } from "lucide-react";
import { Separator } from "../ui/separator";
import { format, parseISO, isValid } from "date-fns";
import { compressImage, uploadImageString } from "@/lib/image-upload-helper";


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

interface EditAccommodationDialogProps {
  children?: ReactNode;
  accommodationToEdit: Accommodation;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditAccommodationDialog({ children, accommodationToEdit, open: controlledOpen, onOpenChange: setControlledOpen }: EditAccommodationDialogProps) {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;
  
  const { updateAccommodation } = useContext(TimelineContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  // Initialize state with values from the accommodation to be edited
  const [name, setName] = useState(accommodationToEdit.name);
  const [description, setDescription] = useState(accommodationToEdit.description);
  const [location, setLocation] = useState(accommodationToEdit.location);
  const [photo, setPhoto] = useState<string | null | undefined>(accommodationToEdit.photo);
  const [photo2, setPhoto2] = useState<string | null | undefined>(accommodationToEdit.photo2);
  const [emotions, setEmotions] = useState<string[]>(Array.isArray(accommodationToEdit.emotion) ? accommodationToEdit.emotion : (accommodationToEdit.emotion ? [accommodationToEdit.emotion] : []));
  const [date, setDate] = useState(accommodationToEdit.date);
  const [displayPreset, setDisplayPreset] = useState<DisplayTransform['preset']>('landscape');
  const [displayCrop, setDisplayCrop] = useState<DisplayTransform['crop']>('fit');
  const [displayGravity, setDisplayGravity] = useState<DisplayTransform['gravity']>('auto');
  const [photosTransforms, setPhotosTransforms] = useState<Record<string | number, { positionX: number; positionY: number; zoom: number }>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (open && accommodationToEdit) {
        setName(accommodationToEdit.name);
        setDescription(accommodationToEdit.description);
        setLocation(accommodationToEdit.location);
        setPhoto(accommodationToEdit.photo);
        setPhoto2(accommodationToEdit.photo2);
        setEmotions(Array.isArray(accommodationToEdit.emotion) ? accommodationToEdit.emotion : (accommodationToEdit.emotion ? [accommodationToEdit.emotion] : []));
        setDate(accommodationToEdit.date);
        setDisplayPreset(accommodationToEdit.displayTransform?.preset ?? 'landscape');
        setDisplayCrop(accommodationToEdit.displayTransform?.crop ?? 'fit');
        setDisplayGravity(accommodationToEdit.displayTransform?.gravity ?? 'auto');
        setPhotosTransforms((accommodationToEdit.displayTransform?.photosTransforms as any) || {});
    }
  }, [open, accommodationToEdit]);

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
             uploadedPhotoUrl = await uploadImageString(photo);
        }
        let uploadedPhoto2Url = photo2;
        if (photo2 && photo2.startsWith('data:')) {
             uploadedPhoto2Url = await uploadImageString(photo2);
        }

        await updateAccommodation(accommodationToEdit.id, {
            name,
            description,
            photo: uploadedPhotoUrl,
            photo2: uploadedPhoto2Url || null,
            location,
            emotion: emotions.length > 0 ? emotions : ["Neutre"],
            date: dateToSave.toISOString(),
            displayTransform: {
              preset: displayPreset,
              crop: displayGravity === 'custom' ? 'fill' : displayCrop,
              gravity: displayGravity,
              photosTransforms: photosTransforms,
              positionX: photosTransforms[0]?.positionX,
              positionY: photosTransforms[0]?.positionY,
              zoom: photosTransforms[0]?.zoom,
            },
        });
        
        setOpen(false);
        toast({ title: "Logement mis à jour !" });

    } catch(error: any) {
        console.error("Failed to update accommodation", error);
        toast({ variant: "destructive", title: "Erreur de mise à jour", description: error?.message || "Une erreur est survenue." });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    
    try {
      setIsConverting(true);
      const compressed = await compressImage(processingFile);
      setPhoto(compressed);
      toast({ title: "Photo prête à être enregistrée." });
    } catch (err) {
      console.error("Compression error:", err);
      toast({ variant: "destructive", title: "Erreur lors du traitement de l'image" });
    } finally {
      setIsConverting(false);
      if (e.target) e.target.value = '';
    }
  };

  const handlePhoto2Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    try {
      setIsConverting(true);
      const compressed = await compressImage(processingFile);
      setPhoto2(compressed);
      toast({ title: "Photo 2 prête à être enregistrée." });
    } catch (err) {
      console.error("Compression error:", err);
      toast({ variant: "destructive", title: "Erreur lors du traitement de l'image" });
    } finally {
      setIsConverting(false);
      if (e.target) e.target.value = '';
    }
  };

  const cleanup = () => {
    if (accommodationToEdit) {
        setName(accommodationToEdit.name);
        setDescription(accommodationToEdit.description);
        setLocation(accommodationToEdit.location);
        setPhoto(accommodationToEdit.photo);
        setPhoto2(accommodationToEdit.photo2);
        setEmotions(Array.isArray(accommodationToEdit.emotion) ? accommodationToEdit.emotion : (accommodationToEdit.emotion ? [accommodationToEdit.emotion] : []));
        setDate(accommodationToEdit.date);
        setDisplayPreset(accommodationToEdit.displayTransform?.preset ?? 'landscape');
        setDisplayCrop(accommodationToEdit.displayTransform?.crop ?? 'fit');
        setDisplayGravity(accommodationToEdit.displayTransform?.gravity ?? 'auto');
        setPhotosTransforms((accommodationToEdit.displayTransform?.photosTransforms as any) || {});
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
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] flex flex-col z-[5000]"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
         <form onSubmit={handleFormSubmit} className="flex flex-col overflow-hidden h-full">
          <DialogHeader className="shrink-0">
            <DialogTitle>Modifier le logement</DialogTitle>
          </DialogHeader>
           <div className="flex-grow overflow-y-auto pr-6 -mr-6">
             <div className="space-y-6 py-4">
                  <div className="space-y-3">
                     <Label className="text-muted-foreground">Souvenirs visuels (jusqu'à 2 photos)</Label>
                     {photo ? (
                         <div className="h-[280px] w-full rounded-xl overflow-hidden relative border shadow-sm">
                             <InteractiveImageFrame
                               src={photo}
                               alt="Photo 1"
                               width={600}
                               height={600}
                               positionX={photosTransforms[0]?.positionX ?? 50}
                               positionY={photosTransforms[0]?.positionY ?? 50}
                               zoom={photosTransforms[0]?.zoom ?? 1.25}
                               badgeLabel="Photo 1"
                               topRightActions={
                                 <Button type="button" variant="destructive" size="icon" className="h-8 w-8 bg-red-600/90 text-white" onClick={() => setPhoto(null)}>
                                     <Trash2 className="h-4 w-4"/>
                                 </Button>
                               }
                               onFramingChange={(framing) => {
                                 if (displayGravity !== 'custom') setDisplayGravity('custom');
                                 setPhotosTransforms(prev => ({ ...prev, 0: framing }));
                               }}
                             />
                         </div>
                     ) : (
                        <Button type="button" variant="outline" className="w-full h-16 flex-col gap-1" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isConverting}>
                             {isConverting ? <Loader2 className="h-5 w-5 animate-spin"/> : <ImageIcon className="h-5 w-5" />}
                             <span className="text-xs">{isConverting ? "Conversion..." : "Importer la photo principale"}</span>
                         </Button>
                     )}
                     <Input type="file" accept="image/*,.heic,.heif" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />

                     {photo2 ? (
                         <div className="h-[280px] w-full rounded-xl overflow-hidden relative border shadow-sm">
                             <InteractiveImageFrame
                               src={photo2}
                               alt="Photo 2"
                               width={600}
                               height={600}
                               positionX={photosTransforms[1]?.positionX ?? 50}
                               positionY={photosTransforms[1]?.positionY ?? 50}
                               zoom={photosTransforms[1]?.zoom ?? 1.25}
                               badgeLabel="Photo 2"
                               topRightActions={
                                 <Button type="button" variant="destructive" size="icon" className="h-8 w-8 bg-red-600/90 text-white" onClick={() => setPhoto2(null)}>
                                     <Trash2 className="h-4 w-4"/>
                                 </Button>
                               }
                               onFramingChange={(framing) => {
                                 if (displayGravity !== 'custom') setDisplayGravity('custom');
                                 setPhotosTransforms(prev => ({ ...prev, 1: framing }));
                               }}
                             />
                         </div>
                     ) : photo ? (
                         <Button type="button" variant="outline" className="w-full h-12 border-dashed border-primary/40 hover:bg-primary/5 gap-2 text-primary font-medium rounded-xl" onClick={() => fileInput2Ref.current?.click()} disabled={isLoading || isConverting}>
                             <Plus className="h-4 w-4" />
                             <span className="text-xs">Ajouter une 2ème photo du logement</span>
                         </Button>
                     ) : null}
                     <Input type="file" accept="image/*,.heic,.heif" className="hidden" ref={fileInput2Ref} onChange={handlePhoto2Upload} />
                  </div>
                 
                 <Separator />
                 <div>
                    <Label className="text-muted-foreground flex items-center gap-2">Affichage (persistant)</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Format</Label>
                        <select className="w-full border rounded-md h-9 px-2" value={displayPreset} onChange={(e) => setDisplayPreset(e.target.value as any)} disabled={isLoading}>
                          <option value="landscape">Paysage</option>
                          <option value="portrait">Portrait</option>
                          <option value="square">Carré</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Recadrage</Label>
                        <select className="w-full border rounded-md h-9 px-2" value={displayCrop} onChange={(e) => setDisplayCrop(e.target.value as any)} disabled={isLoading}>
                          <option value="fill">Remplir</option>
                          <option value="fit">Ajuster</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Gravité</Label>
                        <select className="w-full border rounded-md h-9 px-2" value={displayGravity} onChange={(e) => setDisplayGravity(e.target.value as any)} disabled={isLoading}>
                          <option value="auto">Auto</option>
                          <option value="center">Centre</option>
                          <option value="custom">Manuel</option>
                        </select>
                      </div>
                    </div>
                 </div>
                
                 <div className="space-y-2">
                    <Label htmlFor="name">Nom du logement</Label>
                    <Input 
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="ex: Hôtel Belle Vue"
                        disabled={isLoading}
                    />
                 </div>


                 <div>
                    <Label htmlFor="description" className="text-muted-foreground">
                        Description
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
