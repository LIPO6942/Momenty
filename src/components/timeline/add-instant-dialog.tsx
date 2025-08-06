

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
import { Camera, MapPin, Trash2, LocateFixed, Loader2, Image as ImageIcon, Wand2 } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { describePhoto } from "@/ai/flows/describe-photo-flow";
import { Separator } from "../ui/separator";

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
  const { addInstant, activeTrip, activeStay } = useContext(TimelineContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const activeContext = activeTrip || activeStay;
    if (activeContext && !location) {
        setLocation(activeContext.location || "");
    }
  }, [activeTrip, activeStay, location]);

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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPhoto(result);
        toast({ title: "Photo prête à être ajoutée." });
      };
      reader.readAsDataURL(file);
    }
  };

  const cleanup = () => {
    const activeContext = activeTrip || activeStay;
    setDescription("");
    setLocation(activeContext?.location || "");
    setPhoto(null);
    setEmotion(null);
    setIsCameraMode(false);
    setHasCameraPermission(null);
    setIsAnalyzing(false);
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

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            setPhoto(dataUrl);
            setIsCameraMode(false); // Exit camera mode after taking photo
            toast({title: "Photo capturée !"});
        }
    }
  }

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!description && !photo) {
        toast({variant: "destructive", title: "Veuillez ajouter une description ou une photo."});
        return;
    }
    const finalDescription = description || (photo ? "Photo souvenir" : "Note");

    const newInstant = {
      type: photo ? "photo" as const : "note" as const,
      title: finalDescription.substring(0, 30) + (finalDescription.length > 30 ? '...' : ''),
      description: finalDescription,
      date: new Date().toISOString(),
      location: location || "Lieu inconnu",
      emotion: emotion || "Neutre",
      photo: photo,
      category: 'Note' // Default category, will be updated by context
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
                    <Label>Ajouter un souvenir visuel</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button type="button" variant="outline" className="h-20 flex-col gap-2" onClick={() => fileInputRef.current?.click()}>
                            <ImageIcon className="h-6 w-6" />
                            <span>Importer</span>
                        </Button>
                        <Button type="button" variant="outline" className="h-20 flex-col gap-2" onClick={() => setIsCameraMode(true)}>
                            <Camera className="h-6 w-6" />
                            <span>Prendre photo</span>
                        </Button>
                    </div>
                    <Input type="file" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                 </div>

                {photo && (
                    <div className="relative group">
                        <Image src={photo} alt="Aperçu" width={400} height={800} className="rounded-md object-cover w-full h-auto max-h-[40vh]" />
                        <div className="absolute top-2 right-2 flex gap-2">
                            <Button type="button" variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleAnalyzePhoto(photo)} disabled={isAnalyzing}>
                                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Wand2 className="h-4 w-4"/>}
                            </Button>
                            <Button type="button" variant="destructive" size="icon" className="h-8 w-8" onClick={() => setPhoto(null)}>
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                )}
                 
                 <Separator />

                 <div className="space-y-2">
                    <Label htmlFor="description" className="flex items-center gap-2">
                        Qu'avez-vous en tête ?
                        {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                    </Label>
                    <Textarea 
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Décrivez votre moment... ou laissez l'IA le faire pour vous à partir d'une photo." 
                        className="min-h-[100px]"
                        disabled={isAnalyzing}
                    />
                 </div>

                 <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                        Où étiez-vous ?
                        {(isLocating || isAnalyzing) && <Loader2 className="h-4 w-4 animate-spin" />}
                    </Label>
                    <div className="flex items-center gap-1 mt-2 border rounded-md">
                        <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-3" />
                        <Input 
                            id="location"
                            name="location" 
                            placeholder="Lieu (ex: Paris, France)" 
                            className="border-0 focus-visible:ring-0 flex-grow"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            disabled={isLocating || isAnalyzing}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={handleGetLocation} disabled={isLocating || isAnalyzing}>
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
                    <Button type="submit" disabled={isAnalyzing || isLocating}>
                        {(isAnalyzing || isLocating) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Publier
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
