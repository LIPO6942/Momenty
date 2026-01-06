
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
import { Camera, MapPin, Trash2, LocateFixed, Loader2, Image as ImageIcon, Wand2, Building, Globe, Users, Utensils, Home, Images, Check, ChevronsUpDown } from "lucide-react";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { describePhoto } from "@/ai/flows/describe-photo-flow";
import { improveDescription as improveTextDescription } from "@/ai/flows/improve-description-flow";
import { Separator } from "../ui/separator";
import type { Encounter, Dish, Accommodation } from "@/lib/types";
import { cn } from "@/lib/utils";
import type heic2any from "heic2any";
import { VoiceInput } from "@/components/ui/voice-input";


interface AddInstantDialogProps {
    children: ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const moods = [
    { name: "Heureux", icon: "😊" },
    { name: "Excité", icon: "🤩" },
    { name: "Émerveillé", icon: "🤯" },
    { name: "Détendu", icon: "😌" },
    { name: "Curieux", icon: "🤔" },
    { name: "Nostalgique", icon: "😢" },
];

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_WIDTH = 1920; // Max width for compression

export function AddInstantDialog({ children, open, onOpenChange }: AddInstantDialogProps) {
    const { toast } = useToast();
    const { addInstant, addEncounter, addDish, addAccommodation } = useContext(TimelineContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { activeTrip, activeStay } = useContext(TimelineContext);
    const activeContext = activeTrip || activeStay;

    // Form State
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState("");
    const [city, setCity] = useState("");
    const [country, setCountry] = useState("");
    const [photos, setPhotos] = useState<string[]>([]);
    const [emotions, setEmotions] = useState<string[]>([]);
    const [isEncounter, setIsEncounter] = useState(false);
    const [encounterName, setEncounterName] = useState("");
    const [isDish, setIsDish] = useState(false);
    const [dishName, setDishName] = useState("");
    const [isAccommodation, setIsAccommodation] = useState(false);
    const [accommodationName, setAccommodationName] = useState("");

    // Kol Youm API State
    const [places, setPlaces] = useState<{ label: string; zone: string }[]>([]);
    const [isFetchingPlaces, setIsFetchingPlaces] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [placesMap, setPlacesMap] = useState<Map<string, string>>(new Map()); // Restaurant -> Zone

    // UI State
    const [isLocating, setIsLocating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isImprovingText, setIsImprovingText] = useState(false);
    const [isCameraMode, setIsCameraMode] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Skip this effect when in dish mode - we manage location manually for restaurant selection
        if (isDish) return;

        if (activeContext) {
            setCountry(activeContext.location || "");
            const finalLocation = city ? `${city}, ${activeContext.location}` : activeContext.location;
            setLocation(finalLocation || "");
        } else {
            const finalLocation = city && country ? `${city}, ${country}` : (city || country);
            setLocation(finalLocation);
        }
    }, [activeContext, city, country, isDish]);

    // Fetch places from local API proxy (bypasses CORS)
    useEffect(() => {
        const fetchPlaces = async () => {
            setIsFetchingPlaces(true);
            try {
                console.log('[Kol Youm] Fetching places from local API proxy...');
                const response = await fetch('/api/kol-youm-places');
                const result = await response.json();

                console.log('[Kol Youm] API Response:', result);

                if (result.success && Array.isArray(result.places)) {
                    console.log(`[Kol Youm] Loaded ${result.places.length} places`);
                    setPlaces(result.places);

                    // Build the map for zone lookups
                    const map = new Map<string, string>();
                    result.places.forEach((place: { label: string; zone: string }) => {
                        map.set(place.label, place.zone);
                    });
                    setPlacesMap(map);
                } else {
                    console.error('[Kol Youm] Failed to load places:', result.error || 'Unknown error');
                }
            } catch (error) {
                console.error('[Kol Youm] Failed to fetch places:', error);
            } finally {
                setIsFetchingPlaces(false);
            }
        };

        fetchPlaces();
    }, []);

    const handleSelectPlace = (currentValue: string) => {
        // cmdk passes the value in lowercase, so we need case-insensitive matching
        const selectedPlace = places.find(
            place => place.label.toLowerCase() === currentValue.toLowerCase()
        );
        if (selectedPlace) {
            setLocation(selectedPlace.label);
            setCity(selectedPlace.zone);
            setOpenCombobox(false);
        } else {
            console.warn('[Kol Youm] No match found for:', currentValue);
        }
    };

    const showPlacesCombobox = isDish && (places.length > 0 || isFetchingPlaces);


    useEffect(() => {
        let stream: MediaStream | null = null;
        const getCameraPermission = async () => {
            if (isCameraMode) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    setHasCameraPermission(true);

                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (error) {
                    console.error('Error accessing camera:', error);
                    setHasCameraPermission(false);
                    toast({
                        variant: 'destructive',
                        title: 'Accès à la caméra refusé',
                        description: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
                    });
                }
            }
        };
        getCameraPermission();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }
    }, [isCameraMode, toast]);

    const handleAnalyzePhoto = async (photoDataUri: string) => {
        setIsAnalyzing(true);
        try {
            const result = await describePhoto({ photoDataUri });
            if (result.description) {
                setDescription(prev => prev ? `${prev}\n\n${result.description}` : result.description);
            }
            if (result.location) {
                const parts = result.location.split(',').map(s => s.trim()).filter(Boolean);
                const resultCountry = parts.length >= 2 ? parts[parts.length - 1] : (parts[0] || '');
                const resultCity = parts.length >= 2 ? parts[0] : '';

                if (resultCity) {
                    setCity(resultCity);
                }
                if (!(activeTrip || activeStay) && resultCountry) {
                    setCountry(resultCountry);
                }
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
            const result = await improveTextDescription({ description });
            if (result.improvedDescription) {
                setDescription(result.improvedDescription);
            }
            toast({ title: "Description améliorée par l'IA." });
        } catch (e) {
            console.error(e);
            toast({ variant: "destructive", title: "L'amélioration par IA a échoué." });
        } finally {
            setIsImprovingText(false);
        }
    }

    const compressImage = (file: File | Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target?.result as string;
                img.onload = () => {
                    if (file.size < MAX_IMAGE_SIZE_MB * 1024 * 1024 && img.width <= MAX_IMAGE_WIDTH) {
                        // No compression needed
                        return resolve(img.src);
                    }

                    toast({ title: "Compression d'une image volumineuse..." });
                    const canvas = document.createElement('canvas');
                    const scaleFactor = MAX_IMAGE_WIDTH / img.width;
                    const newWidth = img.width > MAX_IMAGE_WIDTH ? MAX_IMAGE_WIDTH : img.width;
                    const newHeight = img.width > MAX_IMAGE_WIDTH ? img.height * scaleFactor : img.height;

                    canvas.width = newWidth;
                    canvas.height = newHeight;

                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject('Could not get canvas context');

                    ctx.drawImage(img, 0, 0, newWidth, newHeight);
                    resolve(canvas.toDataURL('image/jpeg', 0.8)); // Compress to JPEG with 80% quality
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsConverting(true);
        toast({ title: `Traitement de ${files.length} photo(s)...` });

        for (const file of Array.from(files)) {
            let processingFile: File | Blob = file;

            if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
                toast({ title: 'Conversion d\'une image HEIC...', description: 'Cela peut prendre un instant.' });
                try {
                    const heic2any = (await import('heic2any')).default;
                    const convertedBlob = await heic2any({
                        blob: file,
                        toType: "image/jpeg",
                        quality: 0.9,
                    });
                    processingFile = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                } catch (error) {
                    console.error('HEIC Conversion Error:', error);
                    toast({ variant: "destructive", title: "Erreur de conversion", description: `Impossible de convertir ${file.name}.` });
                    continue;
                }
            }

            try {
                const compressedDataUrl = await compressImage(processingFile);
                setPhotos(prev => [...prev, compressedDataUrl]);
            } catch (error) {
                console.error(`Erreur de traitement du fichier: ${file.name}`, error);
                toast({
                    variant: "destructive",
                    title: "Erreur d'importation",
                    description: `Impossible de traiter le fichier "${file.name}".`
                });
            }
        }

        // This needs a slight delay to allow all file readers to complete
        setTimeout(() => {
            setIsConverting(false);
            toast({ title: 'Toutes les photos ont été traitées.' });
        }, 100 * files.length); // Rough estimate

        if (e.target) {
            e.target.value = ''; // Reset input
        }
    };


    const cleanup = () => {
        setDescription("");
        setLocation("");
        setCity("");
        setCountry("");
        setPhotos([]);
        setEmotions([]);
        setIsCameraMode(false);
        setHasCameraPermission(null);
        setIsAnalyzing(false);
        setIsImprovingText(false);
        setIsEncounter(false);
        setEncounterName("");
        setIsDish(false);
        setDishName("");
        setIsAccommodation(false);
        setAccommodationName("");
        setIsSubmitting(false);
    }

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast({ variant: "destructive", title: "La géolocalisation n'est pas supportée par votre navigateur." });
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
                        const foundCity = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.suburb || data.address.hamlet || data.address.locality || '';
                        const foundCountry = data.address.country || '';
                        setCity(foundCity);
                        if (!(activeTrip || activeStay)) {
                            setCountry(foundCountry);
                        }
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

    const handleTakePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const dataUrl = canvas.toDataURL('image/png');
                // Always add to the list of photos (multi-select is default)
                setPhotos(prev => [...prev, dataUrl]);
                setIsCameraMode(false); // Exit camera mode after taking photo
                toast({ title: "Photo capturée !" });
            }
        }
    }

    const handleToggleEmotion = (moodName: string) => {
        setEmotions(prev =>
            prev.includes(moodName)
                ? prev.filter(m => m !== moodName)
                : [...prev, moodName]
        );
    };

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            if (!description && photos.length === 0) {
                toast({ variant: "destructive", title: "Veuillez ajouter une description ou une photo." });
                setIsSubmitting(false);
                return;
            }
            if (!location) {
                toast({ variant: "destructive", title: "Veuillez renseigner un lieu." });
                setIsSubmitting(false);
                return;
            }

            let uploadedPhotoUrls: string[] = [];
            if (photos.length > 0) {
                const uploadPromises = photos.map(async (photoDataUrl) => {
                    const formData = new FormData();
                    const blob = await (await fetch(photoDataUrl)).blob();
                    formData.append('file', blob);

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                    });

                    if (!response.ok) {
                        throw new Error(`Échec du téléversement d'une image.`);
                    }
                    const result = await response.json();
                    return result.secure_url;
                });
                uploadedPhotoUrls = await Promise.all(uploadPromises);
            }

            const mainPhoto = uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls[0] : null;

            if (isEncounter) {
                if (!encounterName) {
                    toast({ variant: "destructive", title: "Veuillez nommer la personne rencontrée." });
                    setIsSubmitting(false);
                    return;
                }
                const newEncounter: Omit<Encounter, 'id'> = {
                    name: encounterName,
                    description: description || "Rencontre mémorable",
                    date: new Date().toISOString(),
                    location,
                    emotion: emotions.length > 0 ? emotions : ["Neutre"],
                    photo: mainPhoto,
                };
                await addEncounter(newEncounter);
                toast({ title: "Nouvelle rencontre ajoutée !" });
            } else if (isDish) {
                if (!dishName) {
                    toast({ variant: "destructive", title: "Veuillez nommer le plat." });
                    setIsSubmitting(false);
                    return;
                }
                const newDish: Omit<Dish, 'id'> = {
                    name: dishName,
                    description: description || "Un plat mémorable",
                    date: new Date().toISOString(),
                    location,
                    emotion: emotions.length > 0 ? emotions : ["Neutre"],
                    photo: mainPhoto,
                };
                await addDish(newDish);
                toast({ title: "Nouveau plat ajouté !" });
            } else if (isAccommodation) {
                if (!accommodationName) {
                    toast({ variant: "destructive", title: "Veuillez nommer le logement." });
                    setIsSubmitting(false);
                    return;
                }
                const newAccommodation: Omit<Accommodation, 'id'> = {
                    name: accommodationName,
                    description: description || "Un logement mémorable",
                    date: new Date().toISOString(),
                    location,
                    emotion: emotions.length > 0 ? emotions : ["Neutre"],
                    photo: mainPhoto,
                };
                await addAccommodation(newAccommodation);
                toast({ title: "Nouveau logement ajouté !" });
            } else {
                const finalDescription = description || (photos.length > 0 ? "Collage photo" : "Note");
                const newInstant = {
                    type: photos.length > 0 ? "photo" as const : "note" as const,
                    title: finalDescription.substring(0, 30) + (finalDescription.length > 30 ? '...' : ''),
                    description: finalDescription,
                    date: new Date().toISOString(),
                    location: location || "Lieu inconnu",
                    emotion: emotions.length > 0 ? emotions : ["Neutre"],
                    photos: uploadedPhotoUrls,
                    category: ['Note'] // Default category, will be updated by context
                };
                await addInstant(newInstant);
                toast({ title: "Nouvel instant ajouté !" });
            }

            onOpenChange(false);
            cleanup();
        } catch (error) {
            console.error("Submission failed", error);
            toast({ variant: "destructive", title: "La publication a échoué", description: "Veuillez réessayer." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isLoading = isLocating || isAnalyzing || isImprovingText || isConverting || isSubmitting;

    const handleToggleEncounter = () => {
        setIsEncounter(!isEncounter);
        if (!isEncounter) {
            setIsDish(false);
            setIsAccommodation(false);
        }
    }

    const handleToggleDish = () => {
        setIsDish(!isDish);
        if (!isDish) {
            setIsEncounter(false);
            setIsAccommodation(false);
        }
    }

    const handleToggleAccommodation = () => {
        setIsAccommodation(!isAccommodation);
        if (!isAccommodation) {
            setIsEncounter(false);
            setIsDish(false);
        }
    }

    const removePhoto = (indexToRemove: number) => {
        setPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
    }


    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            onOpenChange(isOpen);
            if (!isOpen) cleanup();
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
                <form onSubmit={handleFormSubmit} className="flex flex-col overflow-hidden h-full">
                    <DialogHeader className="text-left shrink-0">
                        <DialogTitle>{isCameraMode ? "Prendre une photo" : "Ajouter un instant"}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-grow overflow-y-auto pr-6 -mr-6">
                        <div className="space-y-6 py-4">
                            {isCameraMode ? (
                                <div className="space-y-4">
                                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-black" autoPlay muted playsInline />
                                    <canvas ref={canvasRef} className="hidden" />
                                    {hasCameraPermission === false && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Accès à la caméra requis</AlertTitle>
                                            <AlertDescription>
                                                Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <Label className="flex justify-between items-center">
                                            <span>Ajouter un souvenir visuel</span>
                                        </Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button type="button" variant="outline" className="h-20 flex-col gap-2" onClick={() => fileInputRef.current?.click()}>
                                                {isConverting ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                                                <span>Importer</span>
                                            </Button>
                                            <Button type="button" variant="outline" className="h-20 flex-col gap-2" onClick={() => setIsCameraMode(true)}>
                                                <Camera className="h-6 w-6" />
                                                <span>Prendre photo</span>
                                            </Button>
                                        </div>
                                        <Input type="file" accept="image/*,.heic,.heif" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} multiple />
                                    </div>

                                    {photos.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="relative group">
                                                <Image src={photos[0]} alt="Aperçu principal" width={400} height={800} className="rounded-md object-cover w-full h-auto max-h-[30vh]" />
                                                <div className="absolute top-2 right-2 flex gap-2">
                                                    <Button type="button" variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleAnalyzePhoto(photos[0])} disabled={isLoading}>
                                                        {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                                    </Button>
                                                    <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => removePhoto(0)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            {photos.length > 1 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {photos.slice(1).map((photo, index) => (
                                                        <div key={index} className="relative group">
                                                            <Image src={photo} alt={`Miniature ${index + 1}`} width={80} height={80} className="rounded-md object-cover w-20 h-20" />
                                                            <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => removePhoto(index + 1)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <Separator />

                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="flex items-center justify-between">
                                            <span>{isEncounter ? 'Racontez la rencontre...' : isDish ? 'Décrivez ce plat...' : isAccommodation ? 'Décrivez le logement...' : 'Qu\'avez-vous en tête ?'}</span>
                                            <div className="flex items-center">
                                                <Button type="button" variant="ghost" size="icon" className={cn("h-7 w-7 text-blue-900", isAccommodation && "bg-blue-900/20")} onClick={handleToggleAccommodation} disabled={isLoading}>
                                                    <Home className="h-4 w-4" />
                                                    <span className="sr-only">Marquer comme logement</span>
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className={cn("h-7 w-7 text-blue-900", isDish && "bg-blue-900/20")} onClick={handleToggleDish} disabled={isLoading}>
                                                    <Utensils className="h-4 w-4" />
                                                    <span className="sr-only">Marquer comme plat</span>
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className={cn("h-7 w-7 text-blue-900", isEncounter && "bg-blue-900/20")} onClick={handleToggleEncounter} disabled={isLoading}>
                                                    <Users className="h-4 w-4" />
                                                    <span className="sr-only">Marquer comme rencontre</span>
                                                </Button>
                                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-blue-900" onClick={handleImproveDescription} disabled={isLoading || !description}>
                                                    {isImprovingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                                    <span className="sr-only">Améliorer la description</span>
                                                </Button>
                                            </div>
                                        </Label>
                                        <div className="relative">
                                            <Textarea
                                                id="description"
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Décrivez votre moment... ou laissez l'IA le faire pour vous à partir d'une photo, ou dictez au micro."
                                                className="min-h-[100px] pr-12"
                                                disabled={isLoading}
                                            />
                                            <div className="absolute bottom-2 right-2">
                                                <VoiceInput
                                                    onTranscript={(text) => {
                                                        setDescription(prev => prev ? `${prev} ${text}` : text);
                                                    }}
                                                    size="sm"
                                                    variant="ghost"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {isAccommodation && (
                                        <div className="space-y-2">
                                            <Label htmlFor="accommodationName">Nom de l'hôtel/logement</Label>
                                            <Input
                                                id="accommodationName"
                                                value={accommodationName}
                                                onChange={(e) => setAccommodationName(e.target.value)}
                                                placeholder="ex: Hôtel Belle Vue"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    )}

                                    {isDish && (
                                        <div className="space-y-2">
                                            <Label htmlFor="dishName">Nom du plat</Label>
                                            <Input
                                                id="dishName"
                                                value={dishName}
                                                onChange={(e) => setDishName(e.target.value)}
                                                placeholder="ex: Paella Valenciana"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    )}

                                    {isEncounter && (
                                        <div className="space-y-2">
                                            <Label htmlFor="encounterName">Nom de la personne</Label>
                                            <Input
                                                id="encounterName"
                                                value={encounterName}
                                                onChange={(e) => setEncounterName(e.target.value)}
                                                placeholder="ex: Alex"
                                                disabled={isLoading}
                                            />
                                        </div>
                                    )}

                                    {/* Only show restaurant/place selection when in dish mode */}
                                    {isDish && (
                                        <div className="space-y-2">
                                            <Label htmlFor="location" className="flex items-center gap-2">
                                                C'était ou ?
                                                {(isLocating || isAnalyzing) && <Loader2 className="h-4 w-4 animate-spin" />}
                                            </Label>

                                            {showPlacesCombobox ? (
                                                <div className="flex flex-col gap-2">
                                                    {/* Simple autocomplete input */}
                                                    <div className="relative">
                                                        <div className="flex items-center gap-1 border rounded-md">
                                                            <Utensils className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" />
                                                            <Input
                                                                id="restaurant-search"
                                                                placeholder="Tapez le nom du restaurant..."
                                                                className="border-0 focus-visible:ring-0 flex-grow"
                                                                value={location}
                                                                onChange={(e) => {
                                                                    setLocation(e.target.value);
                                                                    setOpenCombobox(e.target.value.length >= 2);
                                                                    // Auto-select zone if exact match
                                                                    const exactMatch = places.find(p => p.label.toLowerCase() === e.target.value.toLowerCase());
                                                                    if (exactMatch) {
                                                                        setCity(exactMatch.zone);
                                                                    }
                                                                }}
                                                                onFocus={() => {
                                                                    if (location.length >= 2) setOpenCombobox(true);
                                                                }}
                                                                onBlur={() => {
                                                                    // Delay to allow click on dropdown items
                                                                    setTimeout(() => setOpenCombobox(false), 200);
                                                                }}
                                                                disabled={isLoading || isFetchingPlaces}
                                                                autoComplete="off"
                                                            />
                                                            {isFetchingPlaces && <Loader2 className="h-4 w-4 animate-spin mr-3" />}
                                                        </div>

                                                        {/* Dropdown with filtered results */}
                                                        {openCombobox && location.length >= 2 && (
                                                            <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                                                                {places
                                                                    .filter(p => p.label.toLowerCase().includes(location.toLowerCase()))
                                                                    .slice(0, 15) // Limit to 15 results for performance
                                                                    .map((place) => (
                                                                        <div
                                                                            key={`${place.label}-${place.zone}`}
                                                                            className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex flex-col"
                                                                            onMouseDown={(e) => {
                                                                                e.preventDefault(); // Prevent blur
                                                                                setLocation(place.label);
                                                                                setCity(place.zone);
                                                                                setOpenCombobox(false);
                                                                            }}
                                                                        >
                                                                            <span className="font-medium">{place.label}</span>
                                                                            <span className="text-xs text-muted-foreground">{place.zone}</span>
                                                                        </div>
                                                                    ))}
                                                                {places.filter(p => p.label.toLowerCase().includes(location.toLowerCase())).length === 0 && (
                                                                    <div className="px-3 py-2 text-muted-foreground text-sm">
                                                                        Aucun résultat trouvé
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Zone display */}
                                                    {city && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-grow">
                                                                <div className="flex items-center gap-1 border rounded-md bg-muted/50">
                                                                    <Building className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" />
                                                                    <Input
                                                                        id="city"
                                                                        name="city"
                                                                        placeholder="Ville (Zone)"
                                                                        className="border-0 focus-visible:ring-0 flex-grow bg-transparent"
                                                                        value={city}
                                                                        readOnly
                                                                        disabled
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <Button
                                                        type="button"
                                                        variant="link"
                                                        className="h-auto p-0 text-xs text-muted-foreground self-start"
                                                        onClick={() => {
                                                            // Fallback to manual entry
                                                            setPlaces([]);
                                                        }}
                                                    >
                                                        Je ne trouve pas mon restaurant (Saisie manuelle)
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-grow space-y-2">
                                                        <div className="flex items-center gap-1 border rounded-md">
                                                            {isDish ? (
                                                                <Utensils className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" />
                                                            ) : (
                                                                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" />
                                                            )}
                                                            <Input
                                                                id="location"
                                                                placeholder={isDish ? "Nom du restaurant" : "Nom du lieu"}
                                                                className="border-0 focus-visible:ring-0 flex-grow"
                                                                value={location}
                                                                onChange={(e) => setLocation(e.target.value)}
                                                                disabled={isLoading}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1 border rounded-md">
                                                            <Building className="h-5 w-5 text-red-400 flex-shrink-0 ml-3" />
                                                            <Input
                                                                id="city"
                                                                name="city"
                                                                placeholder="Ville"
                                                                className="border-0 focus-visible:ring-0 flex-grow"
                                                                value={city}
                                                                onChange={(e) => setCity(e.target.value)}
                                                                disabled={isLoading}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-1 border rounded-md">
                                                            <Globe className="h-5 w-5 text-red-400 flex-shrink-0 ml-3" />
                                                            <Input
                                                                id="country"
                                                                name="country"
                                                                placeholder="Pays"
                                                                className="border-0 focus-visible:ring-0 flex-grow"
                                                                value={country}
                                                                onChange={(e) => setCountry(e.target.value)}
                                                                disabled={isLoading || !!activeContext}
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" onClick={handleGetLocation} disabled={isLoading} className="self-center text-red-400">
                                                        <LocateFixed className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label>Quelle était votre humeur ?</Label>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {moods.map(mood => (
                                                <Button
                                                    key={mood.name}
                                                    type="button"
                                                    variant={emotions.includes(mood.name) ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleToggleEmotion(mood.name)}
                                                    className="rounded-full"
                                                >
                                                    {mood.icon} {mood.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="justify-between sm:justify-between pt-4 mt-auto shrink-0">
                        {isCameraMode ? (
                            <div className="w-full flex justify-between">
                                <Button type="button" variant="ghost" onClick={() => setIsCameraMode(false)}>Retour</Button>
                                <Button type="button" onClick={handleTakePhoto} disabled={!hasCameraPermission}>Capturer</Button>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-2">
                                    <DialogClose asChild>
                                        <Button type="button" variant="ghost">Fermer</Button>
                                    </DialogClose>
                                    <Button type="submit" disabled={isLoading}>
                                        {isSubmitting ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : null}
                                        {isSubmitting ? 'Publication...' : 'Publier'}
                                    </Button>
                                </div>
                            </>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

