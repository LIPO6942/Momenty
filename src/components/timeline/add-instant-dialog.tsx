

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
import { Camera, MapPin, Trash2, LocateFixed, Loader2, Image as ImageIcon, Wand2, Building, Globe, Users, Utensils, Home, Images } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { describePhoto } from "@/ai/flows/describe-photo-flow";
import { improveDescription as improveTextDescription } from "@/ai/flows/improve-description-flow";
import { Separator } from "../ui/separator";
import { saveEncounter, saveImage, type Encounter, type Dish, type Accommodation } from "@/lib/idb";
import { cn } from "@/lib/utils";
import type heic2any from "heic2any";


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
  
  // UI State
  const [isLocating, setIsLocating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImprovingText, setIsImprovingText] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeContext) {
        setCountry(activeContext.location || "");
        const finalLocation = city ? `${city}, ${activeContext.location}` : activeContext.location;
        setLocation(finalLocation || "");
    } else {
        const finalLocation = city && country ? `${city}, ${country}` : (city || country);
        setLocation(finalLocation);
    }
  }, [activeContext, city, country]);


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
            const [resultCity, resultCountry] = result.location.split(',').map(s => s.trim());
            setCity(resultCity || '');
            if (!(activeTrip || activeStay)) {
                setCountry(resultCountry || '');
            }
        }
        toast({ title: "Analyse IA terminée." });
    } catch(e) {
        console.error(e);
        toast({ variant: "destructive", title: "L'analyse par IA a échoué."});
    } finally {
        setIsAnalyzing(false);
    }
  }

  const handleImproveDescription = async () => {
    if (!description) {
        toast({variant: "destructive", title: "Veuillez d'abord écrire une description."});
        return;
    }
    setIsImprovingText(true);
    try {
        const result = await improveTextDescription({ description });
        if (result.improvedDescription) {
            setDescription(result.improvedDescription);
        }
        toast({ title: "Description améliorée par l'IA." });
    } catch(e) {
        console.error(e);
        toast({ variant: "destructive", title: "L'amélioration par IA a échoué."});
    } finally {
        setIsImprovingText(false);
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
  
    setIsConverting(true);
    toast({ title: `Traitement de ${files.length} photo(s)...` });

    for (const file of Array.from(files)) {
      let processingFile: File | Blob = file;
    
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
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
          continue;
        }
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Always add to the list of photos (multi-select is default)
          setPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.onerror = () => {
        console.error(`Erreur de lecture du fichier: ${file.name}`);
        toast({
          variant: "destructive",
          title: "Erreur d'importation",
          description: `Impossible de lire le fichier "${file.name}".`
        });
      };
      reader.readAsDataURL(processingFile);
    }
    
    setIsConverting(false);
    toast({ title: 'Toutes les photos ont été traitées.' });
  
    if (e.target) {
      e.target.value = '';
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
                    const foundCity = data.address.city || data.address.town || data.address.village || '';
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
            toast({title: "Photo capturée !"});
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
            toast({variant: "destructive", title: "Veuillez ajouter une description ou une photo."});
            setIsSubmitting(false);
            return;
        }
        if (!location) {
            toast({variant: "destructive", title: "Veuillez renseigner un lieu."});
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
                toast({variant: "destructive", title: "Veuillez nommer la personne rencontrée."});
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
                toast({variant: "destructive", title: "Veuillez nommer le plat."});
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
                toast({variant: "destructive", title: "Veuillez nommer le logement."});
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
        toast({variant: "destructive", title: "La publication a échoué", description: "Veuillez réessayer."});
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
                            {isConverting ? <Loader2 className="h-6 w-6 animate-spin"/> : <ImageIcon className="h-6 w-6" />}
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
                                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4"/>}
                                </Button>
                                <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => removePhoto(0)}>
                                    <Trash2 className="h-4 w-4"/>
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
                    <Textarea 
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez votre moment... ou laissez l'IA le faire pour vous à partir d'une photo." 
                        className="min-h-[100px]"
                        disabled={isLoading}
                    />
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

                 <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                        Où étiez-vous ?
                        {(isLocating || isAnalyzing) && <Loader2 className="h-4 w-4 animate-spin" />}
                    </Label>
                    <div className="flex items-center gap-2">
                        <div className="flex-grow space-y-2">
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
                 </div>
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
                          <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
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
