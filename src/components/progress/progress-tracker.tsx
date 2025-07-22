"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, Plus, Trash2, Upload, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import type { ProgressPhoto } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";

const initialPhotos: ProgressPhoto[] = [
    { id: '1', imageUrl: 'https://placehold.co/600x400.png', caption: 'Repas sain !', category: 'Alimentation', dateTaken: new Date().toISOString() },
    { id: '2', imageUrl: 'https://placehold.co/600x400.png', caption: 'Posture du guerrier', category: 'Sport', dateTaken: new Date(Date.now() - 86400000 * 2).toISOString() },
];


export function ProgressTracker() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<ProgressPhoto[]>(initialPhotos);
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    if (showCamera) {
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error("Erreur d'accès à la caméra:", error);
          setHasCameraPermission(false);
          setShowCamera(false);
          toast({
            variant: "destructive",
            title: "Accès à la caméra refusé",
            description: "Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.",
          });
        }
      };
      getCameraPermission();
    } else {
        if(videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [showCamera, toast]);
  
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if(context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            setCapturedImage(canvas.toDataURL('image/png'));
            setShowCamera(false);
        }
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!capturedImage) {
        toast({ variant: "destructive", title: "Aucune image capturée."});
        return;
    }
    const formData = new FormData(event.currentTarget);
    const caption = formData.get("caption") as string;
    const category = formData.get("category") as string;

    const newPhoto: ProgressPhoto = {
        id: Date.now().toString(),
        imageUrl: capturedImage,
        caption,
        category,
        dateTaken: new Date().toISOString(),
    };

    setPhotos(prev => [newPhoto, ...prev]);
    setOpen(false);
    setCapturedImage(null);
    toast({ title: "Photo ajoutée avec succès !"});
  };

  const deletePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
    toast({ title: "Photo supprimée."});
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2" /> Ajouter une Photo
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
         <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter une nouvelle photo</DialogTitle>
          </DialogHeader>
            {showCamera ? (
                 <div className="space-y-4">
                    <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                    {!hasCameraPermission && (
                         <Alert variant="destructive">
                            <AlertTitle>Accès à la caméra requis</AlertTitle>
                            <AlertDescription>
                                Veuillez autoriser l'accès à la caméra pour utiliser cette fonctionnalité.
                            </AlertDescription>
                        </Alert>
                    )}
                     <canvas ref={canvasRef} className="hidden" />
                     <div className="flex justify-center gap-4">
                        <Button type="button" onClick={() => setShowCamera(false)} variant="ghost">Annuler</Button>
                        <Button type="button" onClick={handleCapture} disabled={!hasCameraPermission}>
                            <Camera className="mr-2" />
                            Capturer
                        </Button>
                     </div>
                 </div>
            ) : (
                <div className="space-y-4 py-4">
                    {capturedImage ? (
                        <div className="relative">
                            <Image src={capturedImage} alt="Captured" width={400} height={300} className="rounded-md w-full" />
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setCapturedImage(null)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button type="button" onClick={() => setShowCamera(true)} className="w-full">
                            <Camera className="mr-2" /> Prendre une photo
                        </Button>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="caption">Légende</Label>
                        <Textarea id="caption" name="caption" placeholder="Décrivez votre progrès..." required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Catégorie</Label>
                        <Select name="category" required defaultValue="Sport">
                            <SelectTrigger>
                            <SelectValue placeholder="Choisir une catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="Sport">Sport</SelectItem>
                            <SelectItem value="Bien-être">Bien-être</SelectItem>
                            <SelectItem value="Alimentation">Alimentation</SelectItem>
                            <SelectItem value="Développement personnel">Développement personnel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="ghost">Fermer</Button>
                </DialogClose>
                {!showCamera && <Button type="submit" disabled={!capturedImage}>Enregistrer</Button>}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {photos.sort((a,b) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime()).map((photo) => (
          <Card key={photo.id} className="overflow-hidden group">
             <CardHeader className="p-0 relative">
                <Image
                    src={photo.imageUrl}
                    alt={photo.caption}
                    width={600}
                    height={400}
                    className="aspect-video object-cover w-full"
                    data-ai-hint="healthy lifestyle"
                />
                <Button onClick={() => deletePhoto(photo.id)} variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-4">
              <p className="font-semibold">{photo.caption}</p>
              <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
                <span>{photo.category}</span>
                <span>{new Date(photo.dateTaken).toLocaleDateString('fr-FR')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
