

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
import type { Dish, DisplayTransform } from "@/lib/types";
import { Image as ImageIcon, MapPin, Trash2, CalendarIcon, Wand2, Loader2, Utensils, Check, ChevronsUpDown, Plus } from "lucide-react";
import { Separator } from "../ui/separator";
import { format, parseISO, isValid } from "date-fns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
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
  { name: "Gourmand", icon: "😋" },
  { name: "Régalé", icon: "🍛" },
  { name: "Savoureux", icon: "🤤" },
];

interface EditDishDialogProps {
  children?: ReactNode;
  dishToEdit: Dish;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditDishDialog({ children, dishToEdit, open: controlledOpen, onOpenChange: setControlledOpen }: EditDishDialogProps) {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;
  
  const { updateDish } = useContext(TimelineContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  // Initialize state with values from the dish to be edited
  const [name, setName] = useState(dishToEdit.name);
  const [description, setDescription] = useState(dishToEdit.description);
  const [location, setLocation] = useState(dishToEdit.location);
  const [photo, setPhoto] = useState<string | null | undefined>(dishToEdit.photo);
  const [photo2, setPhoto2] = useState<string | null | undefined>(dishToEdit.photo2);
  const [emotions, setEmotions] = useState<string[]>(Array.isArray(dishToEdit.emotion) ? dishToEdit.emotion : (dishToEdit.emotion ? [dishToEdit.emotion] : []));
  const [date, setDate] = useState(dishToEdit.date);
  const [displayPreset, setDisplayPreset] = useState<DisplayTransform['preset']>('landscape');
  const [displayCrop, setDisplayCrop] = useState<DisplayTransform['crop']>('fit');
  const [displayGravity, setDisplayGravity] = useState<DisplayTransform['gravity']>('auto');

  // Kol Youm API State
  const [places, setPlaces] = useState<{ label: string; zone: string; category: string }[]>([]);
  const [isFetchingPlaces, setIsFetchingPlaces] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [city, setCity] = useState(dishToEdit.city || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    if (open && dishToEdit) {
      setName(dishToEdit.name);
      setDescription(dishToEdit.description);
      setLocation(dishToEdit.location);
      setPhoto(dishToEdit.photo);
      setPhoto2(dishToEdit.photo2);
      setEmotions(Array.isArray(dishToEdit.emotion) ? dishToEdit.emotion : (dishToEdit.emotion ? [dishToEdit.emotion] : []));
      setDate(dishToEdit.date);
      setCity(dishToEdit.city || "");
      setDisplayPreset(dishToEdit.displayTransform?.preset ?? 'landscape');
      setDisplayCrop(dishToEdit.displayTransform?.crop ?? 'fit');
      setDisplayGravity(dishToEdit.displayTransform?.gravity ?? 'auto');
    }
  }, [open, dishToEdit]);

  // Fetch places
  useEffect(() => {
    const fetchPlaces = async () => {
      setIsFetchingPlaces(true);
      try {
        const response = await fetch('/api/kol-youm-places');
        const result = await response.json();
        if (result.success && Array.isArray(result.places)) {
          setPlaces(result.places);
        }
      } catch (error) {
        console.error('[Kol Youm] Failed to fetch places:', error);
      } finally {
        setIsFetchingPlaces(false);
      }
    };
    if (open) fetchPlaces();
  }, [open]);

  const handleSelectPlace = (currentValue: string) => {
    const selectedPlace = places.find(
      place => place.label.toLowerCase() === currentValue.toLowerCase()
    );
    if (selectedPlace) {
      setLocation(selectedPlace.label);
      setCity(selectedPlace.zone);
      setSelectedCategory(selectedPlace.category);
      setOpenCombobox(false);
    }
  };


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

      await updateDish(dishToEdit.id, {
        name,
        description,
        photo: uploadedPhotoUrl,
        photo2: uploadedPhoto2Url,
        location,
        city,
        emotion: emotions.length > 0 ? emotions : ["Neutre"],
        date: dateToSave.toISOString(),
        displayTransform: { preset: displayPreset, crop: displayCrop, gravity: displayGravity },
      });

      // --- Sync with Kol Youm if it's a dish and we have a location/city ---
      const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
      if (isOnline && name && location && city) {
        try {
          const syncResponse = await fetch('/api/sync-kol-youm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userEmail: user?.email,
              placeName: location,
              cityName: city,
              category: selectedCategory || 'restaurants',
              dishName: name,
              date: dateToSave.getTime(),
              postUrl: `https://momenty-ten.vercel.app/plats?id=${dishToEdit.id}`
            })
          });
          const syncResult = await syncResponse.json();
          console.log('[Kol Youm Sync Update]', syncResult);
        } catch (e) {
          console.error('[Kol Youm Sync Error Update]', e);
        }
      }

      setOpen(false);
      toast({ title: "Plat mis à jour !" });

    } catch (error) {
      console.error("Failed to update dish", error);
      toast({ variant: "destructive", title: "Erreur de mise à jour" });
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
      toast({ title: "Photo 1 prête à être enregistrée." });
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
    if (dishToEdit) {
      setName(dishToEdit.name);
      setDescription(dishToEdit.description);
      setLocation(dishToEdit.location);
      setPhoto(dishToEdit.photo);
      setPhoto2(dishToEdit.photo2);
      setEmotions(Array.isArray(dishToEdit.emotion) ? dishToEdit.emotion : (dishToEdit.emotion ? [dishToEdit.emotion] : []));
      setDate(dishToEdit.date);
      setDisplayPreset(dishToEdit.displayTransform?.preset ?? 'landscape');
      setDisplayCrop(dishToEdit.displayTransform?.crop ?? 'fit');
      setDisplayGravity(dishToEdit.displayTransform?.gravity ?? 'auto');
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
      if (!isOpen) cleanup();
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
            <DialogTitle>Modifier le plat</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-6 -mr-6">
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <Label className="text-muted-foreground">Souvenirs visuels (jusqu'à 2 photos)</Label>
                {photo ? (
                  <div className="relative group">
                    <span className="absolute top-2 left-2 z-10 text-[10px] font-black uppercase tracking-wider bg-black/60 text-white px-2 py-0.5 rounded-md">Photo 1</span>
                    <Image src={photo} alt="Photo 1" width={400} height={800} className="rounded-md object-cover w-full h-auto max-h-[30vh]" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => setPhoto(null)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full h-16 flex-col gap-1" onClick={() => fileInputRef.current?.click()} disabled={isLoading || isConverting}>
                    {isConverting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                    <span className="text-xs">{isConverting ? "Conversion..." : "Importer la photo principale"}</span>
                  </Button>
                )}
                <Input type="file" accept="image/*,.heic,.heif" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />

                {photo2 ? (
                  <div className="relative group">
                    <span className="absolute top-2 left-2 z-10 text-[10px] font-black uppercase tracking-wider bg-black/60 text-white px-2 py-0.5 rounded-md">Photo 2</span>
                    <Image src={photo2} alt="Photo 2" width={400} height={800} className="rounded-md object-cover w-full h-auto max-h-[30vh]" />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => setPhoto2(null)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : photo ? (
                  <Button type="button" variant="outline" className="w-full h-12 border-dashed border-primary/40 hover:bg-primary/5 gap-2 text-primary font-medium rounded-xl" onClick={() => fileInput2Ref.current?.click()} disabled={isLoading || isConverting}>
                    <Plus className="h-4 w-4" />
                    <span className="text-xs">Ajouter une 2ème photo du plat</span>
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
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nom du plat</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Paella Valenciana"
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

              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">
                  Où étiez-vous ?
                  {isFetchingPlaces && <Loader2 className="h-4 w-4 animate-spin" />}
                </Label>
                <div className="relative">
                  <div className="flex items-center gap-1 border rounded-md">
                    <Utensils className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" />
                    <Input
                      placeholder="Tapez le nom du restaurant..."
                      className="border-0 focus-visible:ring-0 flex-grow"
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        setOpenCombobox(e.target.value.length >= 2);
                      }}
                      onFocus={() => {
                        if (location.length >= 2) setOpenCombobox(true);
                      }}
                      onBlur={() => {
                        setTimeout(() => setOpenCombobox(false), 200);
                      }}
                      disabled={isLoading}
                    />
                  </div>

                  {openCombobox && places.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-md shadow-lg max-h-[200px] overflow-auto">
                      <Command className="bg-transparent">
                        <CommandList>
                          <CommandGroup>
                            {places
                              .filter(p => p.label.toLowerCase().includes(location.toLowerCase()))
                              .map((place) => (
                                <CommandItem
                                  key={place.label}
                                  value={place.label}
                                  onSelect={handleSelectPlace}
                                  className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent"
                                >
                                  <Utensils className="h-4 w-4" />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{place.label}</span>
                                    <span className="text-xs text-muted-foreground">{place.zone}</span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  )}
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
