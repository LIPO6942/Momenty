"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, Plus, Trash2, Upload, X } from "lucide-react";
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
import type { TimelineEvent } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";

interface AddPhotoDialogProps {
  onAddEvent?: (event: Omit<TimelineEvent, 'id' | 'time' | 'icon'>) => void;
  trigger: ReactNode;
}

export function AddPhotoDialog({ onAddEvent, trigger }: AddPhotoDialogProps) {
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  useEffect(() => {
    if (open && showCamera) {
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
  }, [showCamera, open, toast]);
  
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
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    // This is where you would typically handle the new event data
    // For now, we just show a toast
    console.log({ title, description, photo: capturedImage });

    setOpen(false);
    setCapturedImage(null);
    toast({ title: "Événement photo ajouté (dans la console) !" });
  };
  
  const cleanup = () => {
    setCapturedImage(null);
    setShowCamera(false);
  }

  return (
      <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if(!isOpen) cleanup();
      }}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
         <form onSubmit={handleFormSubmit}>
          <DialogHeader>
            <DialogTitle>Ajouter une photo</DialogTitle>
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
                        <Label htmlFor="title">Titre</Label>
                        <Input id="title" name="title" placeholder="Ex: Mon déjeuner" required />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="description">Description (optionnel)</Label>
                        <Textarea id="description" name="description" placeholder="Quelques détails..." />
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
  );
}
