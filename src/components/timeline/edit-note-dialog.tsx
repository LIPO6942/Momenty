

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
import type { Instant } from "@/lib/types";
import { Image as ImageIcon, MapPin, Trash2, CalendarIcon, Wand2, Loader2, Images, Tag, Check, ChevronsUpDown, X } from "lucide-react";
import { Separator } from "../ui/separator";
import { PhotoCollage } from "@/components/timeline/photo-collage";
import { format, parseISO, isValid } from "date-fns";
import { describePhoto } from "@/ai/flows/describe-photo-flow";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AudioPicker } from "../ui/audio-picker";
import type { DisplayTransform } from "@/lib/types";
import { DescriptionStylePicker, type DescriptionStyle } from "@/components/timeline/description-style-picker";
import { ArtisticStylePicker } from "@/components/timeline/artistic-style-picker";
import type { PhotoFilter, PhotoFilterType } from "@/lib/types";
import { compressImage, uploadImageString, uploadMultipleImages } from "@/lib/image-upload-helper";


interface EditNoteDialogProps {
  children?: ReactNode;
  instantToEdit: Instant;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const moods = [
  { name: "Heureux", icon: "😊" },
  { name: "Excité", icon: "🤩" },
  { name: "Émerveillé", icon: "🤯" },
  { name: "Détendu", icon: "😌" },
  { name: "Curieux", icon: "🤔" },
  { name: "Nostalgique", icon: "😢" },
];

const allCategories = ['Gastronomie', 'Culture', 'Nature', 'Shopping', 'Art', 'Sport', 'Détente', 'Voyage', 'Note', 'Plage', 'Séjour'];


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


export function EditNoteDialog({ children, instantToEdit, open: controlledOpen, onOpenChange: setControlledOpen }: EditNoteDialogProps) {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;
  
  const { updateInstant } = useContext(TimelineContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize state with values from the instant to be edited
  const [description, setDescription] = useState(instantToEdit.description);
  const [location, setLocation] = useState(instantToEdit.location);
  const [photos, setPhotos] = useState<string[]>(instantToEdit.photos || []);
  const [emotions, setEmotions] = useState<string[]>(Array.isArray(instantToEdit.emotion) ? instantToEdit.emotion : (instantToEdit.emotion ? [instantToEdit.emotion] : []));
  const [date, setDate] = useState(instantToEdit.date);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImprovingText, setIsImprovingText] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isMultiSelect, setIsMultiSelect] = useState(true); // Always allow multi-select in edit mode
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [displayPreset, setDisplayPreset] = useState<DisplayTransform['preset']>('landscape');
  const [displayCrop, setDisplayCrop] = useState<DisplayTransform['crop']>('fit');
  const [displayGravity, setDisplayGravity] = useState<DisplayTransform['gravity']>('auto');
  const [displayPositionX, setDisplayPositionX] = useState<number>(50);
  const [displayPositionY, setDisplayPositionY] = useState<number>(50);
  const [displayZoom, setDisplayZoom] = useState<number>(1.25);
  const [photosTransforms, setPhotosTransforms] = useState<Record<string | number, { positionX: number; positionY: number; zoom: number }>>({});
  const [descriptionStyle, setDescriptionStyle] = useState<DescriptionStyle>((instantToEdit.descriptionStyle && ['classique-italique', 'magazine-bold', 'polaroid-marker', 'cinematique'].includes(instantToEdit.descriptionStyle)) ? instantToEdit.descriptionStyle as DescriptionStyle : "classique-italique");
  const [audioUrl, setAudioUrl] = useState<string | null>(instantToEdit.audio || null);

  // ── Photo filter state ─────────────────────────────────────────────────
  const [selectedFilter, setSelectedFilter] = useState<PhotoFilterType | null>(instantToEdit.photoFilter?.filter || null);
  const [filteredUrl, setFilteredUrl] = useState<string | null>(instantToEdit.photoFilter?.filteredUrl || null);

  useEffect(() => {
    if (open && instantToEdit) {
      setDescription(instantToEdit.description);
      setLocation(instantToEdit.location);
      setPhotos(instantToEdit.photos || []);
      setEmotions(Array.isArray(instantToEdit.emotion) ? instantToEdit.emotion : (instantToEdit.emotion ? [instantToEdit.emotion] : []));
      setDate(instantToEdit.date);
      setCategories(Array.isArray(instantToEdit.category) ? instantToEdit.category : (instantToEdit.category ? [instantToEdit.category] : []));
      setDisplayPreset(instantToEdit.displayTransform?.preset ?? 'landscape');
      setDisplayCrop(instantToEdit.displayTransform?.crop ?? 'fit');
      setDisplayGravity(instantToEdit.displayTransform?.gravity ?? 'auto');
      setDisplayPositionX(instantToEdit.displayTransform?.positionX ?? 50);
      setDisplayPositionY(instantToEdit.displayTransform?.positionY ?? 50);
      setDisplayZoom(instantToEdit.displayTransform?.zoom ?? 1.25);
      setPhotosTransforms((instantToEdit.displayTransform?.photosTransforms as any) || {});
      setDescriptionStyle((instantToEdit.descriptionStyle && ['classique-italique', 'magazine-bold', 'polaroid-marker', 'cinematique'].includes(instantToEdit.descriptionStyle)) ? instantToEdit.descriptionStyle as DescriptionStyle : "classique-italique");
      setAudioUrl(instantToEdit.audio || null);
      // Initialize photo filter state
      setSelectedFilter(instantToEdit.photoFilter?.filter || null);
      setFilteredUrl(instantToEdit.photoFilter?.filteredUrl || null);
    }
  }, [open, instantToEdit]);

  // Handle 3 photos auto-layout combination (landscape, fill, center)
  useEffect(() => {
    if (photos.length === 3) {
      setDisplayPreset('landscape');
      setDisplayCrop('fill');
      setDisplayGravity('center');
    }
  }, [photos.length]);


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
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "L'analyse par IA a échoué." });
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleImproveDescription = async () => {
    if (!description) {
      toast({ variant: "destructive", title: "Veuillez d'abord écrire une description." });
      return;
    }
    setIsImprovingText(true);
    try {
      const res = await fetch('/api/improve-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Erreur serveur');
      if (data.improvedDescription) {
        setDescription(data.improvedDescription);
      }
      toast({ title: "Description améliorée par l'IA." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "L'amélioration par IA a échoué." });
    } finally {
      setIsImprovingText(false);
    }
  }


  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isConverting) {
      toast({ title: "Veuillez patienter pendant la préparation des photos..." });
      return;
    }
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
      // Safely upload all new/dataUrl photos to Cloudinary and preserve order
      const finalPhotoUrls = await uploadMultipleImages(photos);

      // Also ensure filteredUrl is uploaded if it's a data URL
      let finalFilteredUrl = filteredUrl;
      if (finalFilteredUrl && finalFilteredUrl.startsWith('data:')) {
        finalFilteredUrl = await uploadImageString(finalFilteredUrl);
      }

      const finalDescription = description || "Note";

      await updateInstant(instantToEdit.id, {
        title: finalDescription.substring(0, 30) + (finalDescription.length > 30 ? '...' : ''),
        description,
        photos: finalPhotoUrls.length > 0 ? finalPhotoUrls : null,
        location,
        emotion: emotions.length > 0 ? emotions : ["Neutre"],
        date: dateToSave.toISOString(), // Ensure date is in ISO format
        category: categories, // Pass the manually selected categories
        displayTransform: { 
          preset: displayPreset, 
          crop: displayGravity === 'custom' ? 'fill' : displayCrop, 
          gravity: displayGravity,
          positionX: displayPositionX,
          positionY: displayPositionY,
          zoom: displayZoom,
          photosTransforms: photosTransforms,
        },
        descriptionStyle: finalPhotoUrls.length > 0 ? descriptionStyle : undefined,
        audio: audioUrl,
        photoFilter: selectedFilter && finalFilteredUrl ? {
          filter: selectedFilter,
          filteredUrl: finalFilteredUrl
        } : undefined,
      });

      setOpen(false); // Close dialog ONLY after successful update
      toast({ title: "Publication mise à jour !" });
    } catch (error: any) {
      console.error("Error updating instant:", error);
      toast({ 
        title: "Erreur lors de la mise à jour", 
        description: error?.message || "Une erreur est survenue lors de l'enregistrement.",
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsConverting(true);
    toast({ title: `Traitement et optimisation de ${files.length} photo(s)...` });

    try {
      const newCompressedPhotos: string[] = [];

      for (const file of Array.from(files)) {
        let processingFile: File | Blob = file;
        if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          try {
            const heic2any = (await import('heic2any')).default;
            const convertedBlob = await heic2any({
              blob: file,
              toType: "image/jpeg",
              quality: 0.85,
            });
            processingFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          } catch (error) {
            console.error('HEIC Conversion Error:', error);
            toast({ variant: "destructive", title: "Erreur de conversion", description: `Impossible de convertir ${file.name}.` });
            continue;
          }
        }

        try {
          const compressed = await compressImage(processingFile);
          newCompressedPhotos.push(compressed);
        } catch (compErr) {
          console.error("Compression error:", compErr);
          toast({ variant: "destructive", title: "Erreur de fichier", description: `Impossible de lire l'image ${file.name}.` });
        }
      }

      if (newCompressedPhotos.length > 0) {
        setPhotos(prev => [...prev, ...newCompressedPhotos]);
        toast({ title: `${newCompressedPhotos.length} photo(s) ajoutée(s) et prête(s) !` });
      }
    } catch (err) {
      console.error("Photo upload handling error:", err);
      toast({ variant: "destructive", title: "Erreur lors de l'ajout des photos" });
    } finally {
      setIsConverting(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Function to reset state when the dialog is closed without saving
  const cleanup = () => {
    setDescription(instantToEdit.description);
    setLocation(instantToEdit.location);
    setPhotos(instantToEdit.photos || []);
    setEmotions(Array.isArray(instantToEdit.emotion) ? instantToEdit.emotion : (instantToEdit.emotion ? [instantToEdit.emotion] : []));
    setDate(instantToEdit.date);
    setCategories(Array.isArray(instantToEdit.category) ? instantToEdit.category : (instantToEdit.category ? [instantToEdit.category] : []));
    setDisplayPreset(instantToEdit.displayTransform?.preset ?? 'landscape');
    setDisplayCrop(instantToEdit.displayTransform?.crop ?? 'fit');
    setDisplayGravity(instantToEdit.displayTransform?.gravity ?? 'auto');
    setDisplayPositionX(instantToEdit.displayTransform?.positionX ?? 50);
    setDisplayPositionY(instantToEdit.displayTransform?.positionY ?? 50);
    setDisplayZoom(instantToEdit.displayTransform?.zoom ?? 1.25);
    setPhotosTransforms((instantToEdit.displayTransform?.photosTransforms as any) || {});
    setDescriptionStyle((instantToEdit.descriptionStyle && ['classique-italique', 'magazine-bold', 'polaroid-marker', 'cinematique'].includes(instantToEdit.descriptionStyle)) ? instantToEdit.descriptionStyle as DescriptionStyle : "classique-italique");
    setAudioUrl(instantToEdit.audio || null);
    setIsAnalyzing(false);
    setIsImprovingText(false);
  }

  const handleToggleEmotion = (moodName: string) => {
    setEmotions(prev =>
      prev.includes(moodName)
        ? prev.filter(m => m !== moodName)
        : [...prev, moodName]
    );
  };

  const removePhoto = (indexToRemove: number) => {
    setPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
  }

  const handleCategorySelect = (category: string) => {
    setCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) cleanup(); // Reset state if dialog is closed
    }}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] flex flex-col z-[5000]"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col overflow-hidden h-full">
          <DialogHeader className="shrink-0">
            <DialogTitle>Modifier l'instant</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-6 -mr-6">
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Souvenirs visuels</Label>
                {photos.length > 0 && (
                  <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden border shadow-sm bg-slate-50 relative group">
                      <div className="absolute top-2 right-2 z-30 flex gap-2">
                        {photos[0].startsWith('data:') && (
                          <Button 
                            type="button" 
                            variant="secondary" 
                            size="icon" 
                            className="h-8 w-8 bg-white/90 backdrop-blur-sm" 
                            onClick={() => handleAnalyzePhoto(photos[0])} 
                            disabled={isLoading || isAnalyzing}
                            title="Analyser avec l'IA"
                          >
                            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="icon" 
                          className="h-8 w-8 bg-red-600/90 text-white hover:bg-red-700 backdrop-blur-sm shadow-sm" 
                          onClick={() => removePhoto(0)}
                          disabled={isLoading}
                          title="Supprimer la photo principale"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <PhotoCollage 
                        photos={photos} 
                        title="Aperçu du moment" 
                        displayTransform={{ 
                          preset: displayPreset, 
                          crop: displayGravity === 'custom' ? 'fill' : displayCrop, 
                          gravity: displayGravity,
                          positionX: displayPositionX,
                          positionY: displayPositionY,
                          zoom: displayZoom,
                          photosTransforms: photosTransforms,
                        }}
                        audioUrl={audioUrl}
                        interactive={false}
                        onFramingChange={(index, framing) => {
                          if (displayGravity !== 'custom') setDisplayGravity('custom');
                          setPhotosTransforms(prev => ({ ...prev, [index]: framing }));
                          if (index === 0) {
                            setDisplayPositionX(framing.positionX);
                            setDisplayPositionY(framing.positionY);
                            setDisplayZoom(framing.zoom);
                          }
                        }}
                        photoFilter={selectedFilter && filteredUrl ? { filter: selectedFilter, filteredUrl } : undefined}
                      />
                    </div>
                    {photos.length > 1 && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Toutes les photos ({photos.length})</Label>
                        <div className="flex flex-wrap gap-2">
                          {photos.map((photo, index) => (
                            <div key={index} className="relative group rounded-md overflow-hidden border shadow-xs">
                              <Image src={photo} alt={`Photo ${index + 1}`} width={72} height={72} className="rounded-md object-cover w-[72px] h-[72px]" />
                              <span className="absolute bottom-1 left-1 bg-black/60 text-[9px] text-white px-1 rounded font-bold">
                                {index === 0 ? "Principale" : `#${index + 1}`}
                              </span>
                              <Button 
                                type="button" 
                                size="icon" 
                                variant="destructive" 
                                className="absolute top-1 right-1 h-5 w-5 opacity-80 group-hover:opacity-100" 
                                onClick={() => removePhoto(index)}
                                disabled={isLoading}
                                title={`Supprimer la photo ${index + 1}`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full flex-col gap-2 py-4 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all" 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isLoading || isConverting}
                >
                  {isConverting ? (
                    <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-primary" />
                  )}
                  <span className="font-medium text-sm">
                    {isConverting 
                      ? "Optimisation et compression des photos..." 
                      : (photos.length > 0 ? "+ Ajouter d'autres photos à cette publication" : "Ajouter une ou des photos")}
                  </span>
                </Button>
                <Input type="file" accept="image/*,.heic,.heif" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} multiple={isMultiSelect} />
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

                {photos.length > 0 && (
                  <div className="mt-4 space-y-4">
                    <Separator className="mb-4" />
                    <DescriptionStylePicker value={descriptionStyle} onChange={setDescriptionStyle} />
                    {/* Photo filter picker - only for single photos */}
                    {photos.length === 1 && (
                      <ArtisticStylePicker
                        photoUrl={photos[0].startsWith('data:') ? photos[0] : photos[0]}
                        selectedFilter={selectedFilter}
                        onFilterSelect={setSelectedFilter}
                        onFilteredUrlGenerated={setFilteredUrl}
                      />
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description" className="text-muted-foreground flex items-center justify-between">
                  <span>Qu'avez-vous en tête ?</span>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={handleImproveDescription} disabled={isLoading || !description}>
                    {isImprovingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    <span className="sr-only">Améliorer la description</span>
                  </Button>
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

              <div className="space-y-2">
                <Label className="text-muted-foreground flex items-center gap-2">Mémoire Sonore</Label>
                <AudioPicker value={audioUrl || ''} onChange={setAudioUrl} />
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
                    className="flex-grow"
                    value={location || ''}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground flex items-center gap-2">
                  Catégories
                </Label>
                <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isCategoryPopoverOpen}
                      className="w-full justify-between mt-2 h-auto"
                      disabled={isLoading}
                    >
                      <div className="flex gap-1 flex-wrap">
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <Badge key={category} variant="secondary">
                              {category}
                            </Badge>
                          ))
                        ) : (
                          "Choisir une ou plusieurs catégories..."
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Rechercher une catégorie..." />
                      <CommandList>
                        <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                        <CommandGroup>
                          {allCategories.map((category) => (
                            <CommandItem
                              key={category}
                              value={category}
                              onSelect={() => {
                                handleCategorySelect(category);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  categories.includes(category)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {category}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
              {isLoading ? "Mise à jour..." : isConverting ? "Optimisation..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
