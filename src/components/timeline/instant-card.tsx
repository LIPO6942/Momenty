

"use client";

import React, { useContext, useState } from "react";
import Image from "next/image";
import { MoreVertical, Edit, Trash2, MapPin, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TimelineContext } from "@/context/timeline-context";
import { EditNoteDialog } from "@/components/timeline/edit-note-dialog";
import { cn } from "@/lib/utils";
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Instant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export const InstantCard = ({ instant }: { instant: Instant }) => {
    const { deleteInstant } = useContext(TimelineContext);
    const [mainPhoto, setMainPhoto] = useState(instant.photos ? instant.photos[0] : null);

    const emotions = Array.isArray(instant.emotion) ? instant.emotion : [instant.emotion];

    const handleThumbnailClick = (photoUrl: string) => {
        setMainPhoto(photoUrl);
    };

    if (instant.photos && instant.photos.length > 0) {
        const otherPhotos = instant.photos.slice(1);
        
        return (
            <Card className="overflow-hidden rounded-xl border-none shadow-md shadow-slate-200/80">
                 <CardHeader className="p-0 relative">
                    <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white/80 bg-black/30 hover:text-white hover:bg-black/50 focus-visible:text-white">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <EditNoteDialog instantToEdit={instant}>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        <span>Modifier</span>
                                    </DropdownMenuItem>
                                </EditNoteDialog>
                                <DropdownMenuItem onClick={() => deleteInstant(instant.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Supprimer</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                 </CardHeader>
                <CardContent className="p-4 flex gap-4">
                    <div className="flex-grow w-3/4">
                         {mainPhoto && <Image
                            src={mainPhoto}
                            alt={instant.title}
                            width={500}
                            height={500}
                            className="w-full h-auto object-cover aspect-[4/5] rounded-lg"
                            data-ai-hint="travel photo"
                        />}
                    </div>
                    {otherPhotos.length > 0 && (
                        <div className="w-1/4 flex flex-col gap-2">
                            {otherPhotos.map((photo, index) => (
                                <button key={index} onClick={() => handleThumbnailClick(photo)} className="focus:outline-none focus:ring-2 focus:ring-primary rounded-lg">
                                    <Image
                                        src={photo}
                                        alt={`thumbnail ${index + 1}`}
                                        width={100}
                                        height={100}
                                        className={cn(
                                            "w-full h-auto object-cover aspect-square rounded-lg cursor-pointer transition-opacity",
                                            mainPhoto === photo ? 'opacity-50' : 'hover:opacity-80'
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
                 <CardFooter className="flex flex-col items-start gap-3 px-4 pt-0 pb-4">
                    <h3 className="font-bold text-lg">{instant.title}</h3>
                    {instant.description && instant.title.toLowerCase() !== instant.description.toLowerCase() && (
                        <p className="text-sm text-muted-foreground">{instant.description}</p>
                    )}
                    <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-indigo-500" />
                        <span className="font-semibold text-sm">{instant.location}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {instant.category && (
                                <Badge variant="secondary" className="flex items-center gap-1.5">
                                <Tag className="h-3 w-3" />
                                {instant.category}
                            </Badge>
                        )}
                        {emotions.map(emotion => (
                            <Badge key={emotion} variant="outline">
                                {emotion}
                            </Badge>
                        ))}
                    </div>
                </CardFooter>
            </Card>
        )
    }

    // Card for instants without a photo
    return (
        <Card className="overflow-hidden rounded-xl border-none shadow-md shadow-slate-200/80">
            <CardHeader className="flex flex-row items-start justify-between p-4 pb-0">
                <div className="flex items-start gap-4">
                    <div className={cn("w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0", instant.color)}>
                        {instant.icon && React.cloneElement(instant.icon as React.ReactElement, { className: "h-7 w-7 text-white" })}
                    </div>
                    <div className="flex flex-col">
                        <p className="font-bold text-lg text-foreground leading-tight">{instant.title}</p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-secondary focus-visible:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <EditNoteDialog instantToEdit={instant}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Edit className="mr-2 h-4 w-4" />
                                <span>Modifier</span>
                            </DropdownMenuItem>
                        </EditNoteDialog>
                        <DropdownMenuItem onClick={() => deleteInstant(instant.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Supprimer</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            
            <CardContent className="p-4">
              <div className="space-y-4 ml-14 -mt-2">
                {instant.description && instant.title.toLowerCase() !== instant.description.toLowerCase() && (
                    <p className="text-sm text-muted-foreground">{instant.description}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-3 px-4 pt-0 pb-4">
                <div className="w-full ml-14">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-indigo-500" />
                            <span className="font-semibold text-sm text-foreground">{instant.location}</span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-0.5 ml-[22px]">{format(parseISO(instant.date), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-3">
                        {instant.category && (
                            <Badge variant="secondary" className="flex items-center gap-1.5">
                                <Tag className="h-3 w-3" />
                                {instant.category}
                            </Badge>
                        )}
                        {emotions.map(emotion => (
                            <Badge key={emotion} variant="outline">
                                {emotion}
                            </Badge>
                        ))}
                    </div>
                </div>
            </CardFooter>
        </Card>
    );
}
