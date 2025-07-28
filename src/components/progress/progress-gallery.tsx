"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { TimelineEventPhoto } from "@/lib/types";
import { AddPhotoDialog } from "../timeline/add-photo-dialog";
import { Plus } from "lucide-react";


const initialPhotos: TimelineEventPhoto[] = [
    { id: '1', imageUrl: 'https://placehold.co/600x400.png', title: 'Repas sain !', description: 'Salade césar', dateTaken: new Date().toISOString() },
    { id: '2', imageUrl: 'https://placehold.co/600x400.png', title: 'Posture du guerrier', description: 'Yoga du matin', dateTaken: new Date(Date.now() - 86400000 * 2).toISOString() },
];


export function ProgressGallery() {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<TimelineEventPhoto[]>(initialPhotos);

  const deletePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
    toast({ title: "Photo supprimée."});
  }
  
  const addPhotoTrigger = (
    <Button>
        <Plus className="mr-2" /> Ajouter une Photo
    </Button>
  );

  return (
    <div>
        <AddPhotoDialog trigger={addPhotoTrigger}/>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {photos.sort((a,b) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime()).map((photo) => (
          <Card key={photo.id} className="overflow-hidden group">
             <CardHeader className="p-0 relative">
                <Image
                    src={photo.imageUrl}
                    alt={photo.title}
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
              <p className="font-semibold">{photo.title}</p>
              <div className="flex justify-between items-center text-sm text-muted-foreground mt-2">
                <span className="truncate">{photo.description}</span>
                <span>{new Date(photo.dateTaken).toLocaleDateString('fr-FR')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
