

"use client";

import React, { useContext, useState } from "react";
import Image from "next/image";
import { MoreVertical, Edit, Trash2, MapPin, Tag, Music, Play, Pause, Volume2 } from "lucide-react";
import { useRef } from "react";
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
import { cn, getCity, getCountry } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Instant } from "@/lib/types";
import { clTransform, buildTransformFromDisplay } from "@/lib/cloudinary";
import type { DisplayTransform } from "@/lib/types";
import { ImageLightbox } from "@/components/ui/image-lightbox";

import { ParallaxContainer } from "@/components/ui/parallax-container";

const PhotoCollage = ({ photos, title, displayTransform, audioUrl }: { photos: string[], title: string, displayTransform?: DisplayTransform, audioUrl?: string | null }) => {
    const photoCount = photos.length;
    const t = buildTransformFromDisplay(displayTransform);

    const renderGrid = () => {
        const objectClass = t.c === 'fit' ? "object-contain" : "object-cover";
        switch (photoCount) {
            case 1:
                return (
                    <div className="max-h-[600px] sm:max-h-[70vh] w-full flex items-center justify-center bg-black/5 overflow-hidden">
                        <ImageLightbox
                            src={clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g })}
                            photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit", g: "auto" }))}
                            audioUrl={audioUrl}
                            initialIndex={0}
                            alt={title}
                            width={t.w}
                            height={t.h}
                        >
                            <ParallaxContainer speed={0.03} className="w-full h-full">
                                <Image
                                    src={clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g })}
                                    alt={title}
                                    width={t.w}
                                    height={t.h}
                                    className={cn("w-full h-auto max-h-[600px] sm:max-h-[70vh] md:h-[450px]", objectClass)}
                                    data-ai-hint="travel photo"
                                />
                            </ParallaxContainer>
                        </ImageLightbox>
                    </div>
                );
            case 2:
                return (
                    <div className="grid grid-cols-2 gap-1 h-[450px] w-full bg-black/5 overflow-hidden">
                        {photos.map((photo, index) => (
                            <ImageLightbox
                                key={index}
                                src={clTransform(photo, { w: t.w, h: t.h, c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={index}
                                alt={`${title} ${index + 1}`}
                                width={t.w}
                                height={t.h}
                            >
                                <ParallaxContainer speed={0.02 * (index + 1)} className="w-full h-full">
                                    <Image
                                        src={clTransform(photo, { w: t.w, h: t.h, c: t.c, g: t.g })}
                                        alt={`${title} ${index + 1}`}
                                        width={t.w}
                                        height={t.h}
                                        className={cn("w-full h-full first:rounded-tl-xl last:rounded-tr-xl", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        ))}
                    </div>
                );
            case 3:
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-[450px] w-full bg-black/5 overflow-hidden">
                        <div className="col-span-1 row-span-2">
                            <ImageLightbox
                                src={clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={0}
                                alt={`${title} 1`}
                                width={t.w}
                                height={t.h}
                            >
                                <ParallaxContainer speed={0.03} className="w-full h-full">
                                    <Image
                                        src={clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g })}
                                        alt={`${title} 1`}
                                        width={t.w}
                                        height={t.h}
                                        className={cn("w-full h-full rounded-tl-xl", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        </div>
                        <div className="col-span-1 row-span-1">
                            <ImageLightbox
                                src={clTransform(photos[1], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={1}
                                alt={`${title} 2`}
                                width={t.w}
                                height={Math.round(t.h * 0.66)}
                            >
                                <ParallaxContainer speed={0.02} className="w-full h-full">
                                    <Image
                                        src={clTransform(photos[1], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                        alt={`${title} 2`}
                                        width={t.w}
                                        height={Math.round(t.h * 0.66)}
                                        className={cn("w-full h-full rounded-tr-xl", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        </div>
                        <div className="col-span-1 row-span-1">
                            <ImageLightbox
                                src={clTransform(photos[2], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={2}
                                alt={`${title} 3`}
                                width={t.w}
                                height={Math.round(t.h * 0.66)}
                            >
                                <ParallaxContainer speed={0.04} className="w-full h-full">
                                    <Image
                                        src={clTransform(photos[2], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                        alt={`${title} 3`}
                                        width={t.w}
                                        height={Math.round(t.h * 0.66)}
                                        className={cn("w-full h-full", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-[450px] w-full bg-black/5 overflow-hidden">
                        {photos.map((photo, index) => (
                            <ImageLightbox
                                key={index}
                                src={clTransform(photo, { w: t.w, h: t.h, c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={index}
                                alt={`${title} ${index + 1}`}
                                width={t.w}
                                height={t.h}
                            >
                                <ParallaxContainer speed={0.02 * (index + 0.5)} className="w-full h-full">
                                    <Image
                                        src={clTransform(photo, { w: t.w, h: t.h, c: t.c, g: t.g })}
                                        alt={`${title} ${index + 1}`}
                                        width={t.w}
                                        height={t.h}
                                        className={cn("w-full h-full",
                                            objectClass,
                                            index === 0 && "rounded-tl-xl",
                                            index === 1 && "rounded-tr-xl"
                                        )}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        ))}
                    </div>
                );
            default: // 5+ photos
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-[450px] w-full bg-black/5 overflow-hidden">
                        <div className="col-span-1 row-span-2">
                            <ImageLightbox
                                src={clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={0}
                                alt={`${title} 1`}
                                width={t.w}
                                height={t.h}
                            >
                                <ParallaxContainer speed={0.03} className="w-full h-full">
                                    <Image
                                        src={clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g })}
                                        alt={`${title} 1`}
                                        width={t.w}
                                        height={t.h}
                                        className={cn("w-full h-full rounded-tl-xl", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        </div>
                        <div className="col-span-1 row-span-1 relative">
                            <ImageLightbox
                                src={clTransform(photos[1], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={1}
                                alt={`${title} 2`}
                                width={t.w}
                                height={Math.round(t.h * 0.66)}
                            >
                                <ParallaxContainer speed={0.02} className="w-full h-full">
                                    <Image
                                        src={clTransform(photos[1], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                        alt={`${title} 2`}
                                        width={t.w}
                                        height={Math.round(t.h * 0.66)}
                                        className={cn("w-full h-full rounded-tr-xl", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                        </div>
                        <div className="col-span-1 row-span-1 relative">
                            <ImageLightbox
                                src={clTransform(photos[2], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                                audioUrl={audioUrl}
                                initialIndex={2}
                                alt={`${title} 3`}
                                width={t.w}
                                height={Math.round(t.h * 0.66)}
                            >
                                <ParallaxContainer speed={0.04} className="w-full h-full">
                                    <Image
                                        src={clTransform(photos[2], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g })}
                                        alt={`${title} 3`}
                                        width={t.w}
                                        height={Math.round(t.h * 0.66)}
                                        className={cn("w-full h-full", objectClass)}
                                        data-ai-hint="travel photo"
                                    />
                                </ParallaxContainer>
                            </ImageLightbox>
                            {photos.length > 3 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none z-20">
                                    <span className="text-white text-2xl font-bold">+{photos.length - 3}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return <div className="w-full">{renderGrid()}</div>
}


export const InstantCard = ({ instant }: { instant: Instant }) => {
    const { deleteInstant } = useContext(TimelineContext);
    const [isTextVisible, setIsTextVisible] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const emotions = Array.isArray(instant.emotion) ? instant.emotion : [instant.emotion];
    const categories = Array.isArray(instant.category) ? instant.category : (instant.category ? [instant.category] : []);

    // Filter out invalid photo URLs (empty strings, null, undefined)
    const validPhotos = instant.photos?.filter(photo => photo && photo.trim().length > 0) || [];

    if (validPhotos.length > 0) {
        return (
            <Card id={`instant-${instant.id}`} className="overflow-hidden rounded-xl border-none shadow-md shadow-slate-200/80 relative text-white">
                <CardHeader className="p-0 relative">
                    <PhotoCollage photos={validPhotos} title={instant.title} displayTransform={instant.displayTransform} audioUrl={instant.audio} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

                    <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white/80 bg-black/30 hover:text-white hover:bg-black/50 focus-visible:text-white">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Modifier</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => deleteInstant(instant.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Supprimer</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <EditNoteDialog 
                            instantToEdit={instant} 
                            open={isEditDialogOpen} 
                            onOpenChange={setIsEditDialogOpen} 
                        />
                    </div>
                </CardHeader>

                {/* Zone de toggle toujours accessible */}
                <div
                    className="absolute bottom-0 left-0 w-full h-20 cursor-pointer pointer-events-auto z-20"
                    onClick={() => setIsTextVisible(prev => !prev)}
                    title={isTextVisible ? "Cliquer pour masquer" : "Cliquer pour afficher"}
                />

                {/* Conteneur du texte */}
                <div className="absolute bottom-0 left-0 w-full pointer-events-none">
                    <div className={cn(
                        "p-4 space-y-3 transition-transform duration-300 ease-in-out",
                        isTextVisible ? "translate-y-0" : "translate-y-full"
                    )}>
                        <h3 className="font-bold text-lg text-gradient-blue">{instant.title}</h3>
                        {instant.description && (
                            <p className="text-sm text-white/80">{instant.description}</p>
                        )}

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

    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const toggleAudio = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isPlaying) {
            audioRef.current?.pause();
            setIsPlaying(false);
        } else if (instant.audio) {
            if (!audioRef.current) {
                audioRef.current = new Audio(instant.audio);
                audioRef.current.onended = () => setIsPlaying(false);
            }
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    // Clean up audio on unmount
    React.useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    return (
        <Card id={`instant-${instant.id}`} className="overflow-hidden rounded-xl border-none shadow-md shadow-slate-200/80">
            <CardHeader className="flex flex-row items-start justify-between p-4 pb-0">
                <div className="flex items-start gap-4">
                    <div className={cn("w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0 relative", instant.color)}>
                        {instant.icon && React.cloneElement(instant.icon as React.ReactElement, { className: "h-7 w-7 text-white" })}
                        {instant.audio && (
                            <button 
                                onClick={toggleAudio}
                                className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md hover:scale-110 transition-transform cursor-pointer z-10"
                            >
                                {isPlaying ? (
                                    <Pause className="h-3 w-3 text-primary animate-pulse" />
                                ) : (
                                    <Play className="h-3 w-3 text-primary" />
                                )}
                            </button>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-lg text-foreground leading-tight text-gradient-blue">{instant.title}</p>
                            {instant.audio && (
                                <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] bg-indigo-50 text-indigo-600 border-indigo-100 flex items-center gap-1 font-medium">
                                    <Volume2 className="h-2.5 w-2.5" />
                                    Sonore
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-secondary focus-visible:text-foreground">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Modifier</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteInstant(instant.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Supprimer</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <EditNoteDialog 
                    instantToEdit={instant} 
                    open={isEditDialogOpen} 
                    onOpenChange={setIsEditDialogOpen} 
                />
            </CardHeader>

            <CardContent className="p-4">
                <div className="space-y-4 ml-14 -mt-2">
                    {instant.description && (
                        <p className="text-sm text-muted-foreground">{instant.description}</p>
                    )}
                </div>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-3 px-4 pt-0 pb-4">
                <div className="w-full ml-14">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-indigo-500" />
                            <span className="font-semibold text-sm text-foreground">
                                {getCity(instant.location)}, {getCountry(instant.location)}
                            </span>
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
