

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
import type { DescriptionStyle } from "@/components/timeline/description-style-picker";

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Instant } from "@/lib/types";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { PhotoCollage } from "@/components/timeline/photo-collage";
import { ParallaxContainer } from "@/components/ui/parallax-container";




const getDescriptionContainerClass = (style?: DescriptionStyle) => {
    switch (style) {
        case 'magazine': return "bg-black/40 backdrop-blur-sm border-l-4 border-indigo-400 p-3 rounded-r-xl mt-2";
        case 'vibrant': return "bg-gradient-to-br from-pink-500/40 to-indigo-500/40 backdrop-blur-md border border-white/40 rounded-xl p-3 shadow-lg mt-2";
        case 'cinematic': return "bg-transparent p-2 flex justify-center mt-2";
        case 'polaroid': return "bg-black/60 shadow-xl border border-white/20 p-3 mt-2 inline-block";
        case 'chat': return "bg-white/20 backdrop-blur-md rounded-2xl rounded-bl-sm p-3 border border-white/20 shadow-lg mt-2 inline-block";
        default: return "mt-2"; // fallback
    }
}

const getDescriptionTextClass = (style?: DescriptionStyle) => {
    switch (style) {
        case 'magazine': return "first-letter:text-4xl first-letter:font-bold first-letter:text-indigo-400 first-letter:float-left first-letter:mr-2 text-white/95 leading-relaxed font-serif";
        case 'vibrant': return "text-white font-medium leading-relaxed drop-shadow-sm";
        case 'cinematic': return "text-white text-center tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] italic text-lg";
        case 'polaroid': return "font-mono text-[11px] uppercase tracking-widest text-white/90 leading-relaxed";
        case 'chat': return "text-white/95 leading-relaxed text-sm";
        default: return "text-sm text-white/80"; // fallback
    }
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
            <>
            <Card id={`instant-${instant.id}`} className="overflow-hidden rounded-xl border-none shadow-md shadow-slate-200/80 relative text-white">
                <CardHeader className="p-0 relative">
                    <PhotoCollage photos={validPhotos} title={instant.title} displayTransform={instant.displayTransform} audioUrl={instant.audio} collageTemplate={instant.collageTemplate} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

                    <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu modal={false}>
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
                            <div className={getDescriptionContainerClass(instant.descriptionStyle)}>
                                <p className={getDescriptionTextClass(instant.descriptionStyle)}>{instant.description}</p>
                            </div>
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
            <EditNoteDialog 
                instantToEdit={instant} 
                open={isEditDialogOpen} 
                onOpenChange={setIsEditDialogOpen} 
            />
            </>
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
        <>
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
                                <div className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0" title="Contient du son">
                                    <Volume2 className="h-3 w-3" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DropdownMenu modal={false}>
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
        <EditNoteDialog 
            instantToEdit={instant} 
            open={isEditDialogOpen} 
            onOpenChange={setIsEditDialogOpen} 
        />
    </>
    );
}
