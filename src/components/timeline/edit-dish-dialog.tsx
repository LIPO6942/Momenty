

"use client";

import { useState, ReactNode, useContext, useRef, useEffect, useMemo } from "react";
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
import { InteractiveImageFrame } from "@/components/timeline/interactive-image-frame";
import { Image as ImageIcon, MapPin, Trash2, CalendarIcon, Wand2, Loader2, Utensils, Check, ChevronsUpDown, Plus, Building, Globe } from "lucide-react";
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
import { cn, getFlagEmoji, getFlagEmojiByCode } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { compressImage, uploadImageString } from "@/lib/image-upload-helper";
import { countries } from "@/lib/countries";


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
  const [photosTransforms, setPhotosTransforms] = useState<Record<string | number, { positionX: number; positionY: number; zoom: number }>>({});

  // Kol Youm API State
  const [places, setPlaces] = useState<{ label: string; zone: string; category: string }[]>([]);
  const [isFetchingPlaces, setIsFetchingPlaces] = useState(false);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [city, setCity] = useState(dishToEdit.city || "");
  const [country, setCountry] = useState(dishToEdit.country || "");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isAddingPlaceToKolYoum, setIsAddingPlaceToKolYoum] = useState(false);
  const [manuallyAddedPlaces, setManuallyAddedPlaces] = useState<Set<string>>(new Set());
  const restaurantComboboxRef = useRef<HTMLDivElement>(null);
  const countryComboboxRef = useRef<HTMLDivElement>(null);
  const [openCountryCombobox, setOpenCountryCombobox] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number; moved: boolean }>({ x: 0, y: 0, moved: false });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        restaurantComboboxRef.current &&
        !restaurantComboboxRef.current.contains(event.target as Node)
      ) {
        setOpenCombobox(false);
      }
      if (
        countryComboboxRef.current &&
        !countryComboboxRef.current.contains(event.target as Node)
      ) {
        setOpenCountryCombobox(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        moved: false
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
      const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
      if (dx > 8 || dy > 8) {
        touchStartPos.current.moved = true;
      }
    }
  };

  const normalizePlaceStr = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const isPlaceInKolYoum = useMemo(() => {
    if (!location.trim()) return false;
    const clean = normalizePlaceStr(location);
    return places.some(p => normalizePlaceStr(p.label) === clean) || manuallyAddedPlaces.has(clean);
  }, [location, places, manuallyAddedPlaces]);

  const filteredPlaces = useMemo(() => {
    const q = normalizePlaceStr(location);
    if (!q) return [];

    const matches = places.filter(p => normalizePlaceStr(p.label).includes(q));

    matches.sort((a, b) => {
      const aNorm = normalizePlaceStr(a.label);
      const bNorm = normalizePlaceStr(b.label);

      // 1. Exact match top priority
      const aExact = aNorm === q;
      const bExact = bNorm === q;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // 2. Starts with query priority
      const aStarts = aNorm.startsWith(q);
      const bStarts = bNorm.startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // 3. Word in name starts with query
      const aWordStarts = aNorm.split(/\s+/).some(w => w.startsWith(q));
      const bWordStarts = bNorm.split(/\s+/).some(w => w.startsWith(q));
      if (aWordStarts && !bWordStarts) return -1;
      if (!aWordStarts && bWordStarts) return 1;

      // 4. Shorter names first (crucial for 2-letter and short names!)
      if (a.label.length !== b.label.length) {
        return a.label.length - b.label.length;
      }

      return a.label.localeCompare(b.label, 'fr');
    });

    return matches.slice(0, 35);
  }, [places, location]);

  const filteredCountries = useMemo(() => {
    const q = country.trim().toLowerCase();
    const POPULAR_CODES = ["TN", "FR", "IT", "ES", "DZ", "MA", "TR", "DE", "CH", "BE", "CA", "US", "GB", "AE", "SA"];

    if (!q || q === "tunisie") {
      const popular = countries.filter(c => POPULAR_CODES.includes(c.value));
      const others = countries.filter(c => !POPULAR_CODES.includes(c.value));
      return [...popular, ...others];
    }

    const normQ = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matches = countries.filter(c => {
      const labelNorm = c.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const enNorm = c.enLabel.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const codeNorm = c.value.toLowerCase();
      return labelNorm.includes(normQ) || enNorm.includes(normQ) || codeNorm.includes(normQ);
    });

    matches.sort((a, b) => {
      const aNorm = a.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const bNorm = b.label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (aNorm === normQ && bNorm !== normQ) return -1;
      if (bNorm === normQ && aNorm !== normQ) return 1;
      if (aNorm.startsWith(normQ) && !bNorm.startsWith(normQ)) return -1;
      if (bNorm.startsWith(normQ) && !aNorm.startsWith(normQ)) return 1;
      return a.label.localeCompare(b.label, 'fr');
    });

    return matches;
  }, [country]);

  const handleAddPlaceToKolYoum = async (placeNameToAdd?: string, zoneToAdd?: string) => {
    const targetPlace = (placeNameToAdd || location).trim();
    const targetZone = (zoneToAdd || city).trim();

    if (!targetPlace) {
      toast({ variant: "destructive", title: "Veuillez entrer le nom du restaurant." });
      return;
    }
    if (!targetZone) {
      toast({
        variant: "destructive",
        title: "Zone / Ville requise",
        description: "Veuillez d'abord indiquer la zone ou ville (ex: La Marsa, Gammarth, Lac 2...) ci-dessous pour ajouter ce restaurant dans Kol Youm."
      });
      const cityInput = document.getElementById("editDishCity");
      cityInput?.focus();
      return;
    }

    setIsAddingPlaceToKolYoum(true);
    try {
      const response = await fetch('/api/kol-youm-places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addPlace',
          placeName: targetPlace,
          zone: targetZone,
          category: selectedCategory || 'restaurants'
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const cleanKey = targetPlace.toLowerCase();
        const newPlaceObj = {
          label: targetPlace,
          zone: targetZone,
          category: selectedCategory || 'restaurants'
        };
        setPlaces(prev => [...prev, newPlaceObj]);
        setManuallyAddedPlaces(prev => new Set(prev).add(cleanKey));
        setOpenCombobox(false);
        toast({
          title: "Restaurant ajouté à Kol Youm !",
          description: `« ${targetPlace} » (${targetZone}) fait maintenant partie de la base de données Kol Youm.`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur lors de l'ajout",
          description: data.error || "Impossible d'ajouter le restaurant à Kol Youm."
        });
      }
    } catch (err) {
      console.error("Failed to add place to Kol Youm:", err);
      toast({
        variant: "destructive",
        title: "Erreur réseau",
        description: "Impossible de joindre le serveur pour ajouter le restaurant."
      });
    } finally {
      setIsAddingPlaceToKolYoum(false);
    }
  };

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
      setCountry(dishToEdit.country || "");
      setDisplayPreset(dishToEdit.displayTransform?.preset ?? 'landscape');
      setDisplayCrop(dishToEdit.displayTransform?.crop ?? 'fit');
      setDisplayGravity(dishToEdit.displayTransform?.gravity ?? 'auto');
      setPhotosTransforms((dishToEdit.displayTransform?.photosTransforms as any) || {});
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
      setCountry("Tunisie");
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
        country: country.trim() || undefined,
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

      // --- Sync with Kol Youm if it's a dish and we have a location/city AND place is in Kol Youm ---
      const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
      const cleanLoc = location.trim().toLowerCase();
      const isPlaceInDb = places.some(p => p.label.trim().toLowerCase() === cleanLoc) || manuallyAddedPlaces.has(cleanLoc);

      if (isOnline && name && location && city && isPlaceInDb) {
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
      } else if (!isPlaceInDb) {
        console.log(`[Kol Youm Sync Skipped] Le restaurant "${location}" n'est pas dans la base Kol Youm. Aucun envoi vers Kol Youm.`);
      }

      setOpen(false);
      toast({
        title: isPlaceInDb ? "Plat mis à jour et enregistré dans Kol Youm !" : "Plat mis à jour !"
      });

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
                          <Trash2 className="h-4 w-4" />
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
                    {isConverting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
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
                          <Trash2 className="h-4 w-4" />
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
                      <option value="custom">Manuel</option>
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

              <div className="space-y-3 p-3 bg-muted/20 border rounded-xl">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-restaurant-search" className="text-sm font-medium text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-primary" />
                      Nom du restaurant
                    </span>
                    {isFetchingPlaces && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        <span>Kol Youm...</span>
                      </span>
                    )}
                  </Label>
                  <div className="relative" ref={restaurantComboboxRef}>
                    <div className="flex items-center gap-1 border rounded-lg bg-background shadow-xs focus-within:ring-2 focus-within:ring-primary/20">
                      <Utensils className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-3" />
                      <Input
                        id="edit-restaurant-search"
                        placeholder="Tapez le nom du restaurant..."
                        className="border-0 focus-visible:ring-0 flex-grow text-sm h-10 rounded-lg"
                        value={location}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocation(val);
                          setOpenCombobox(val.trim().length >= 1);
                          const cleanVal = normalizePlaceStr(val);
                          const exactMatch = places.find(p => normalizePlaceStr(p.label) === cleanVal);
                          if (exactMatch) {
                            setCity(exactMatch.zone);
                            setSelectedCategory(exactMatch.category);
                          }
                        }}
                        onFocus={() => {
                          if (location.trim().length >= 1) setOpenCombobox(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setOpenCombobox(false);
                        }}
                        disabled={isLoading}
                        autoComplete="off"
                      />
                    </div>

                    {openCombobox && location.trim().length >= 1 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border rounded-xl shadow-xl max-h-[260px] overflow-y-auto p-1">
                        {filteredPlaces.map((place) => (
                          <div
                            key={`${place.label}-${place.zone}`}
                            className="px-3 py-2.5 rounded-lg cursor-pointer hover:bg-accent hover:text-accent-foreground active:bg-accent/80 flex items-center justify-between gap-2 transition-colors select-none text-sm"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onClick={() => {
                              if (touchStartPos.current.moved) return;
                              setLocation(place.label);
                              setCity(place.zone);
                              setSelectedCategory(place.category);
                              setOpenCombobox(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Utensils className="h-4 w-4 text-primary shrink-0" />
                              <span className="font-medium">{place.label}</span>
                            </div>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">{place.zone}</span>
                          </div>
                        ))}
                        {filteredPlaces.length === 0 && (
                          <div className="px-3 py-2 text-muted-foreground text-xs text-center">
                            {isFetchingPlaces ? "Recherche sur Kol Youm..." : `Aucun restaurant trouvé pour "${location}"`}
                          </div>
                        )}
                        {!isPlaceInKolYoum && location.trim().length >= 1 && (
                          <div
                            className="mt-1 p-2 bg-primary/10 hover:bg-primary/20 active:bg-primary/30 border-t border-primary/20 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors select-none"
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onClick={() => {
                              if (touchStartPos.current.moved) return;
                              handleAddPlaceToKolYoum();
                            }}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Plus className="h-4 w-4 text-primary shrink-0" />
                              <span className="text-xs font-semibold text-primary truncate">
                                Ajouter « {location.trim()} » à la base Kol Youm
                              </span>
                            </div>
                            {isAddingPlaceToKolYoum ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                            ) : (
                              <span className="text-[11px] bg-primary text-primary-foreground font-medium px-2 py-0.5 rounded-md shrink-0">
                                + Ajouter
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Statut Kol Youm : Reconnu vs Non répertorié */}
                  {location.trim().length >= 1 && (
                    <div className="pt-1">
                      {isPlaceInKolYoum ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                          <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                          <span><strong>Restaurant répertorié dans Kol Youm :</strong> ce souvenir sera mis à jour et synchronisé dans Kol Youm.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                          <div className="flex items-start gap-1.5">
                            <span className="shrink-0 text-sm">ℹ️</span>
                            <span>
                              Ce restaurant ne fait pas partie de Kol Youm. <strong>Il ne sera pas envoyé à Kol Youm</strong> sauf si vous l'ajoutez :
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 font-semibold text-amber-900 dark:text-amber-100 shrink-0 self-start sm:self-auto rounded-lg"
                            disabled={isAddingPlaceToKolYoum}
                            onClick={() => handleAddPlaceToKolYoum()}
                          >
                            {isAddingPlaceToKolYoum ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 text-primary" />
                            ) : (
                              <Plus className="h-3.5 w-3.5 mr-1" />
                            )}
                            Ajouter à la base Kol Youm
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Zone / Ville */}
                <div className="space-y-1.5">
                  <Label htmlFor="editDishCity" className="text-sm font-medium text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-primary" />
                      Zone / Ville
                    </span>
                    {city && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Remplie automatiquement
                      </span>
                    )}
                  </Label>
                  <div className="flex items-center gap-1 border rounded-lg bg-background shadow-xs focus-within:ring-2 focus-within:ring-primary/20">
                    <Building className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-3" />
                    <Input
                      id="editDishCity"
                      name="city"
                      placeholder="Zone ou ville (ex: La Marsa, Gammarth, Lac 2...)"
                      className="border-0 focus-visible:ring-0 flex-grow text-sm h-10 rounded-lg"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Pays avec saisie assistée depuis tous les pays du monde (par défaut Tunisie) */}
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <Label htmlFor="editDishCountry" className="text-sm font-medium text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Pays <span className="text-muted-foreground font-normal text-xs">(saisie assistée)</span>
                    </span>
                    {country && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <span>{getFlagEmoji(country) || "🌍"}</span>
                        <span>{country}</span>
                      </span>
                    )}
                  </Label>
                  <div className="relative" ref={countryComboboxRef}>
                    <div className="flex items-center gap-1 border rounded-lg bg-background shadow-xs focus-within:ring-2 focus-within:ring-primary/20">
                      <span className="text-base ml-3 select-none flex-shrink-0">
                        {country ? (getFlagEmoji(country) || "🌍") : "🌍"}
                      </span>
                      <Input
                        id="editDishCountry"
                        name="country"
                        placeholder="Tapez un pays (ex: Tunisie, France, Italie, Espagne...)"
                        className="border-0 focus-visible:ring-0 flex-grow text-sm h-10 rounded-lg"
                        value={country}
                        onChange={(e) => {
                          setCountry(e.target.value);
                          setOpenCountryCombobox(true);
                        }}
                        onFocus={() => {
                          setOpenCountryCombobox(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setOpenCountryCombobox(false);
                        }}
                        disabled={isLoading}
                        autoComplete="off"
                      />
                      {country && country.toLowerCase() !== "tunisie" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground mr-1"
                          onClick={() => {
                            setCountry("Tunisie");
                            setOpenCountryCombobox(false);
                          }}
                          title="Revenir à Tunisie"
                        >
                          🇹🇳 Tunisie
                        </Button>
                      )}
                    </div>

                    {openCountryCombobox && (
                      <div className="absolute z-50 w-full mt-1.5 bg-popover text-popover-foreground border rounded-xl shadow-xl max-h-[240px] overflow-y-auto p-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border/40 mb-1 flex items-center justify-between">
                          <span>Pays du monde (saisie assistée)</span>
                          <span
                            className="text-[10px] text-primary cursor-pointer hover:underline"
                            onClick={() => {
                              setCountry("Tunisie");
                              setOpenCountryCombobox(false);
                            }}
                          >
                            Par défaut : 🇹🇳 Tunisie
                          </span>
                        </div>
                        {filteredCountries.slice(0, 35).map((c) => {
                          const isSelected = country.toLowerCase() === c.label.toLowerCase();
                          return (
                            <div
                              key={c.value}
                              className={cn(
                                "px-3 py-2 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors select-none text-sm",
                                isSelected ? "bg-primary/10 text-primary font-semibold" : "hover:bg-accent hover:text-accent-foreground"
                              )}
                              onTouchStart={handleTouchStart}
                              onTouchMove={handleTouchMove}
                              onClick={() => {
                                if (touchStartPos.current.moved) return;
                                setCountry(c.label);
                                setOpenCountryCombobox(false);
                              }}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-lg leading-none shrink-0">{getFlagEmojiByCode(c.value)}</span>
                                <span className="truncate">{c.label}</span>
                                {c.enLabel && c.enLabel !== c.label && (
                                  <span className="text-xs text-muted-foreground truncate">({c.enLabel})</span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground/70 font-mono shrink-0">{c.value}</span>
                            </div>
                          );
                        })}
                        {filteredCountries.length === 0 && (
                          <div className="px-3 py-3 text-muted-foreground text-xs text-center">
                            Aucun pays trouvé pour "{country}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Par défaut sur 🇹🇳 Tunisie. Vous pouvez sélectionner ou taper n'importe quel pays du monde.
                  </p>
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
