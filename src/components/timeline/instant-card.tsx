

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

const PhotoCollage = ({ photos, title }: { photos: string[], title: string }) => {
    const photoCount = photos.length;

    const renderGrid = () => {
        switch (photoCount) {
            case 1:
                return (
                    <Image
                        src={photos[0]}
                        alt={title}
                        width={500}
                        height={500}
                        className="w-full h-full object-cover"
                        data-ai-hint="travel photo"
                    />
                );
            case 2:
                return (
                    <div className="grid grid-cols-2 gap-1 h-full">
                        {photos.map((photo, index) => (
                             <Image
                                key={index}
                                src={photo}
                                alt={`${title} ${index + 1}`}
                                width={300}
                                height={400}
                                className="w-full h-full object-cover first:rounded-l-xl last:rounded-r-xl"
                                data-ai-hint="travel photo"
                            />
                        ))}
                    </div>
                );
            case 3:
                return (
                     <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">
                        <div className="col-span-1 row-span-2">
                             <Image
                                src={photos[0]}
                                alt={`${title} 1`}
                                width={400}
                                height={600}
                                className="w-full h-full object-cover rounded-l-xl"
                                data-ai-hint="travel photo"
                            />
                        </div>
                        <div className="col-span-1 row-span-1">
                             <Image
                                src={photos[1]}
                                alt={`${title} 2`}
                                width={300}
                                height={300}
                                className="w-full h-full object-cover rounded-tr-xl"
                                data-ai-hint="travel photo"
                            />
                        </div>
                         <div className="col-span-1 row-span-1">
                             <Image
                                src={photos[2]}
                                alt={`${title} 3`}
                                width={300}
                                height={300}
                                className="w-full h-full object-cover rounded-br-xl"
                                data-ai-hint="travel photo"
                            />
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">
                       {photos.map((photo, index) => (
                             <Image
                                key={index}
                                src={photo}
                                alt={`${title} ${index + 1}`}
                                width={300}
                                height={300}
                                className={cn("w-full h-full object-cover",
                                    index === 0 && "rounded-tl-xl",
                                    index === 1 && "rounded-tr-xl",
                                    index === 2 && "rounded-bl-xl",
                                    index === 3 && "rounded-br-xl",
                                )}
                                data-ai-hint="travel photo"
                            />
                        ))}
                    </div>
                );
            default: // 5+ photos
                return (
                     <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">
                        <div className="col-span-1 row-span-2">
                             <Image
                                src={photos[0]}
                                alt={`${title} 1`}
                                width={400}
                                height={600}
                                className="w-full h-full object-cover rounded-l-xl"
                                data-ai-hint="travel photo"
                            />
                        </div>
                        <div className="col-span-1 row-span-1 relative">
                             <Image
                                src={photos[1]}
                                alt={`${title} 2`}
                                width={300}
                                height={300}
                                className="w-full h-full object-cover rounded-tr-xl"
                                data-ai-hint="travel photo"
                            />
                        </div>
                         <div className="col-span-1 row-span-1 relative">
                             <Image
                                src={photos[2]}
                                alt={`${title} 3`}
                                width={300}
                                height={300}
                                className="w-full h-full object-cover rounded-br-xl"
                                data-ai-hint="travel photo"
                            />
                             {photos.length > 3 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-br-xl">
                                    <span className="text-white text-2xl font-bold">+{photos.length - 3}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };
    
    return <div className="h-[450px]">{renderGrid()}</div>
}


export const InstantCard = ({ instant }: { instant: Instant }) => {
    const { deleteInstant } = useContext(TimelineContext);
    const [isTextVisible, setIsTextVisible] = useState(true);
    
    const emotions = Array.isArray(instant.emotion) ? instant.emotion : [instant.emotion];
    const categories = Array.isArray(instant.category) ? instant.category : (instant.category ? [instant.category] : []);


    if (instant.photos && instant.photos.length > 0) {
        return (
            <Card className="overflow-hidden rounded-xl border-none shadow-md shadow-slate-200/80 relative text-white">
                 <CardHeader className="p-0 relative">
                    <PhotoCollage photos={instant.photos} title={instant.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

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
                <div 
                    className="absolute bottom-0 left-0 w-full cursor-pointer"
                    onClick={() => setIsTextVisible(prev => !prev)}
                >
                     <div className={cn(
                        "p-4 space-y-3 transition-transform duration-300 ease-in-out",
                        isTextVisible ? "translate-y-0" : "translate-y-full"
                     )}>
                        <h3 className="font-bold text-lg">{instant.title}</h3>
                         {instant.description && instant.title.toLowerCase() !== instant.description.toLowerCase() && (
                            <p className="text-sm text-white/80">{instant.description}</p>
                        )}
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-white/90" />
                            <span className="font-semibold text-sm">{instant.location}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {categories.map(cat => (
                                <Badge key={cat} variant="secondary" className="flex items-center gap-1.5 bg-white/20 text-white border-none">
                                    <Tag className="h-3 w-3" />
                                    {cat}
                                </Badge>
                            ))}
                            {emotions.map(emotion => (
                                <Badge key={emotion} variant="outline" className="bg-white/20 text-white border-none">
                                    {emotion}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
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
                        {categories.map(cat => (
                             <Badge key={cat} variant="secondary" className="flex items-center gap-1.5">
                                <Tag className="h-3 w-3" />
                                {cat}
                            </Badge>
                        ))}
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
