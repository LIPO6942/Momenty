"use client";

import { X, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Instant } from "@/lib/types";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface InstantSidebarProps {
    location: string;
    instants: Instant[];
    souvenir?: string;
    photos?: string[];
    isOpen: boolean;
    onClose: () => void;
}

// Generate AI-like descriptive text linking location and instant
const generateLocationInstantDescription = (location: string, instant: Instant): string => {
    const templates = [
        `Souvenir capturé à ${location}`,
        `Moment vécu à ${location}`,
        `Instant immortalisé à ${location}`,
        `Mémoire de ${location}`,
        `Passage à ${location}`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
};

export const InstantSidebar = ({
    location,
    instants,
    souvenir,
    photos,
    isOpen,
    onClose
}: InstantSidebarProps) => {
    const totalCount = instants.length + (souvenir ? 1 : 0);

    return (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={cn(
                "fixed right-0 top-0 h-full w-full md:w-[420px] bg-background shadow-2xl z-50 transform transition-transform duration-300",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="p-4 border-b flex items-start justify-between bg-gradient-to-r from-primary/10 to-primary/5">
                    <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                        <div>
                            <h2 className="text-xl font-bold text-gradient-blue">{location}</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {totalCount} souvenir{totalCount > 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <ScrollArea className="h-[calc(100vh-80px)]">
                    <div className="p-4 space-y-3">
                        {/* Manual Location Souvenir */}
                        {souvenir && (
                            <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
                                <CardContent className="p-3">
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                        <p className="text-xs font-medium text-primary">Note personnelle du lieu</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic pl-3.5">&quot;{souvenir}&quot;</p>
                                    {photos && photos.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-3 pl-3.5">
                                            {photos.map((photo, index) => (
                                                <div key={index} className="relative group">
                                                    <Image
                                                        src={photo}
                                                        alt={`Photo ${index + 1}`}
                                                        width={60}
                                                        height={60}
                                                        className="rounded-md object-cover h-14 w-14 ring-1 ring-primary/20"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Timeline Instants - Miniaturized */}
                        {instants.length > 0 ? (
                            instants.map(instant => {
                                const instantDate = parseISO(instant.date);
                                const formattedDate = format(instantDate, "d MMM yyyy", { locale: fr });
                                const aiDescription = generateLocationInstantDescription(location, instant);

                                return (
                                    <Card key={instant.id} className="border-border/50 hover:border-primary/30 transition-colors">
                                        <CardContent className="p-3">
                                            {/* AI Description */}
                                            <div className="flex items-start gap-2 mb-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-1.5 flex-shrink-0 animate-pulse" />
                                                <p className="text-xs text-muted-foreground italic">{aiDescription}</p>
                                            </div>

                                            <div className="flex gap-3">
                                                {/* Photo miniature */}
                                                {instant.photos && instant.photos.length > 0 && (
                                                    <div className="relative flex-shrink-0">
                                                        <Image
                                                            src={instant.photos[0]}
                                                            alt={instant.title}
                                                            width={80}
                                                            height={80}
                                                            className="rounded-lg object-cover h-20 w-20 ring-1 ring-border"
                                                        />
                                                        {instant.photos.length > 1 && (
                                                            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center ring-2 ring-background">
                                                                +{instant.photos.length - 1}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">
                                                        {instant.title}
                                                    </h3>

                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{formattedDate}</span>
                                                    </div>

                                                    {instant.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {instant.description}
                                                        </p>
                                                    )}

                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {Array.isArray(instant.category) && instant.category.slice(0, 2).map((cat, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20"
                                                            >
                                                                {cat}
                                                            </span>
                                                        ))}
                                                        {Array.isArray(instant.emotion) && (Array.isArray(instant.emotion) ? instant.emotion : [instant.emotion]).slice(0, 2).map((emotion, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-secondary-foreground border border-secondary"
                                                            >
                                                                {emotion}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : !souvenir && (
                            <div className="text-center py-12 text-muted-foreground">
                                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">Aucun souvenir associé à ce lieu.</p>
                                <p className="text-xs mt-1">Ajoutez des instants depuis la timeline.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </>
    );
};
