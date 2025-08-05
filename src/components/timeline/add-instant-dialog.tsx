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
import { Camera, MapPin, Trash2, LocateFixed, Loader2, Video } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

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
    setIsCameraMode(false);
    setHasCameraPermission(null);
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
    if (!description) {
        toast({variant: "destructive", title: "Veuillez ajouter une description."});
        return;
    }
    const newInstant = {
      type: photo ? "photo" as const : "note" as const,
      title: description.substring(0, 30) + (description.length > 30 ? '...' : ''),
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
        <DialogContent className="sm:max-w-md grid-rows-[auto,1fr,auto] max-h-[90vh]">
         <form onSubmit={handleFormSubmit} className="grid grid-rows-[auto,1fr,auto] h-full overflow-hidden">
          <DialogHeader>
            <DialogTitle>{isCameraMode ? "Prendre une photo" : "Ajouter un instant"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="pr-6">
            <div className="space-y-4 py-4">
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
                {photo && (
                    <div className="relative group">
                        <Image src={photo} alt="Aperçu" width={400} height={800} className="rounded-md object-cover w-full h-auto max-h-full" />
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
                </>
                )}
            </div>
            </ScrollArea>
            <DialogFooter className="justify-between sm:justify-between pt-4">
                {isCameraMode ? (
                     <div className="w-full flex justify-between">
                        <Button type="button" variant="ghost" onClick={() => setIsCameraMode(false)}>Retour</Button>
                        <Button type="button" onClick={handleTakePhoto} disabled={!hasCameraPermission}>Capturer</Button>
                    </div>
                ) : (
                <>
                <div className="flex gap-1">
                 <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="h-5 w-5" />
                </Button>
                 <Button type="button" variant="ghost" size="icon" onClick={() => setIsCameraMode(true)}>
                    <Video className="h-5 w-5" />
                </Button>
                </div>
                 <Input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />

                <div className="flex gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Fermer</Button>
                    </DialogClose>
                    <Button type="submit">Publier</Button>
                </div>
                </>
                )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}
