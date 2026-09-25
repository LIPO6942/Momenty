"use client";

import { useContext, useState, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Trash2, Home, Edit, MoreVertical, Search, X, Globe, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TimelineContext } from "@/context/timeline-context";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn, getCity, getCountry } from "@/lib/utils";
import type { Accommodation } from "@/lib/types";
import { getPhotoFraming } from "@/lib/types";
import { EditAccommodationDialog } from "@/components/timeline/edit-accommodation-dialog";
import { clTransform, buildTransformFromDisplay } from "@/lib/cloudinary";
import { ImageLightbox } from "@/components/ui/image-lightbox";

export default function AccommodationsPage() {
    const { accommodations, deleteAccommodation } = useContext(TimelineContext);
    const { toast } = useToast();
    const [textVisibility, setTextVisibility] = useState<{ [key: string]: boolean }>({});

    // Country search & filter state
    const [countryQuery, setCountryQuery] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

    // Compute list of unique countries with counts
    const countryStats = useMemo(() => {
        const counts: Record<string, number> = {};
        accommodations.forEach(acc => {
            const country = getCountry(acc.location);
            if (country && country !== "Pays inconnu") {
                counts[country] = (counts[country] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count);
    }, [accommodations]);

    // Filter accommodations by selectedCountry and/or countryQuery
    const filteredAccommodations = useMemo(() => {
        return accommodations.filter(acc => {
            const accCountry = getCountry(acc.location);
            const accCity = getCity(acc.location);

            // Filter by chip selection
            if (selectedCountry && accCountry !== selectedCountry) {
                return false;
            }

            // Filter by text search query
            if (countryQuery.trim()) {
                const q = countryQuery.trim().toLowerCase();
                const matchCountry = accCountry.toLowerCase().includes(q);
                const matchCity = accCity.toLowerCase().includes(q);
                const matchName = acc.name && acc.name.toLowerCase().includes(q);
                const matchDesc = acc.description && acc.description.toLowerCase().includes(q);

                if (!matchCountry && !matchCity && !matchName && !matchDesc) {
                    return false;
                }
            }

            return true;
        });
    }, [accommodations, selectedCountry, countryQuery]);

    const handleDelete = (id: string) => {
        deleteAccommodation(id);
        toast({
            title: "Logement supprimé",
            description: "Le souvenir de ce logement a été retiré de votre journal.",
        });
    };

    const toggleTextVisibility = (id: string) => {
        setTextVisibility(prev => ({
            ...prev,
            [id]: !(prev[id] ?? true)
        }));
    };

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
            <div className="py-12 space-y-2">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Home className="h-8 w-8 text-primary" />
                    Mes Logements
                </h1>
                <p className="text-muted-foreground">Les lieux où vous avez séjourné.</p>
            </div>

            {/* Barre de recherche par pays et filtres rapides */}
            {accommodations.length > 0 && (
                <div className="mb-6 space-y-3 bg-card border rounded-2xl p-3.5 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={countryQuery}
                            onChange={(e) => setCountryQuery(e.target.value)}
                            placeholder="Rechercher par pays (ex: France, Tunisie...), ville ou hébergement..."
                            className="pl-10 pr-9 bg-muted/40 border-muted rounded-xl text-sm h-10"
                        />
                        {countryQuery && (
                            <button
                                type="button"
                                onClick={() => setCountryQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                                title="Effacer la recherche"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Chips de pays */}
                    {countryStats.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
                            <button
                                type="button"
                                onClick={() => setSelectedCountry(null)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5",
                                    selectedCountry === null
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <Globe className="h-3 w-3" />
                                Tous les pays ({accommodations.length})
                            </button>
                            {countryStats.map(({ country, count }) => (
                                <button
                                    key={country}
                                    type="button"
                                    onClick={() => setSelectedCountry(selectedCountry === country ? null : country)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1",
                                        selectedCountry === country
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    <span>{country}</span>
                                    <span className="opacity-70 text-[10px]">({count})</span>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 px-1">
                        <span>
                            {filteredAccommodations.length} {filteredAccommodations.length > 1 ? "logements trouvés" : "logement trouvé"}
                        </span>
                        {(selectedCountry || countryQuery) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCountry(null);
                                    setCountryQuery("");
                                }}
                                className="text-primary hover:underline flex items-center gap-1 font-medium"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                </div>
            )}

            {filteredAccommodations.length > 0 ? (
                <div className="grid md:grid-cols-1 gap-8">
                    {filteredAccommodations.map((accommodation) => {
                        const isTextVisible = textVisibility[accommodation.id] ?? true;
                        const t = buildTransformFromDisplay(accommodation.displayTransform);
                        const f0 = getPhotoFraming(accommodation.displayTransform, 0);
                        const f1 = getPhotoFraming(accommodation.displayTransform, 1);

                        return (
                            <Card key={accommodation.id} className="overflow-hidden rounded-xl border-none shadow-md shadow-slate-200/80 relative text-white">
                                {accommodation.photo ? (
                                    <>
                                        {accommodation.photo2 ? (
                                            /* Two photos: side by side with framing, zoom & lightbox */
                                            <div className="grid grid-cols-2 gap-0.5">
                                                <ImageLightbox
                                                    photos={[accommodation.photo, accommodation.photo2]}
                                                    initialIndex={0}
                                                    alt={`Photo 1 de ${accommodation.name}`}
                                                    width={t.w}
                                                    height={t.h}
                                                >
                                                    <div className="w-full h-[280px] overflow-hidden relative">
                                                        <Image
                                                            src={clTransform(accommodation.photo, { w: 400, h: 400, c: 'fill', g: 'auto' })}
                                                            alt={`Photo 1 de ${accommodation.name}`}
                                                            width={400}
                                                            height={400}
                                                            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-all duration-300"
                                                            style={{
                                                                objectPosition: `${f0.positionX}% ${f0.positionY}%`,
                                                                transform: f0.zoom > 1 ? `scale(${f0.zoom})` : undefined,
                                                                transformOrigin: `${f0.positionX}% ${f0.positionY}%`,
                                                            }}
                                                            data-ai-hint="hotel room interior design"
                                                        />
                                                    </div>
                                                </ImageLightbox>
                                                <ImageLightbox
                                                    photos={[accommodation.photo, accommodation.photo2]}
                                                    initialIndex={1}
                                                    alt={`Photo 2 de ${accommodation.name}`}
                                                    width={t.w}
                                                    height={t.h}
                                                >
                                                    <div className="w-full h-[280px] overflow-hidden relative">
                                                        <Image
                                                            src={clTransform(accommodation.photo2, { w: 400, h: 400, c: 'fill', g: 'auto' })}
                                                            alt={`Photo 2 de ${accommodation.name}`}
                                                            width={400}
                                                            height={400}
                                                            className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-all duration-300"
                                                            style={{
                                                                objectPosition: `${f1.positionX}% ${f1.positionY}%`,
                                                                transform: f1.zoom > 1 ? `scale(${f1.zoom})` : undefined,
                                                                transformOrigin: `${f1.positionX}% ${f1.positionY}%`,
                                                            }}
                                                            data-ai-hint="hotel room interior design"
                                                        />
                                                    </div>
                                                </ImageLightbox>
                                            </div>
                                        ) : (
                                            /* Single photo: full width with framing, zoom & lightbox */
                                            <ImageLightbox
                                                src={accommodation.photo}
                                                alt={`Photo de ${accommodation.name}`}
                                                width={t.w}
                                                height={t.h}
                                            >
                                                <div className="w-full h-[400px] overflow-hidden relative">
                                                    <Image
                                                        src={accommodation.photo}
                                                        alt={`Photo de ${accommodation.name}`}
                                                        width={600}
                                                        height={400}
                                                        className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-all duration-300"
                                                        style={{
                                                            objectPosition: `${f0.positionX}% ${f0.positionY}%`,
                                                            transform: f0.zoom > 1 ? `scale(${f0.zoom})` : undefined,
                                                            transformOrigin: `${f0.positionX}% ${f0.positionY}%`,
                                                        }}
                                                        data-ai-hint="hotel room interior design"
                                                    />
                                                </div>
                                            </ImageLightbox>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

                                        <div className="absolute top-2 right-2 flex gap-2 z-20">
                                            <EditAccommodationDialog accommodationToEdit={accommodation}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white/80 hover:text-white hover:bg-white/10 focus-visible:text-white">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </EditAccommodationDialog>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white/80 hover:text-white hover:bg-white/10 focus-visible:text-white">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Supprimer ce logement ?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Cette action est irréversible et supprimera définitivement le souvenir de ce logement de votre journal.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(accommodation.id)}>
                                                            Supprimer
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>

                                        <div
                                            className="absolute bottom-0 left-0 w-full cursor-pointer transition-opacity duration-300"
                                            onClick={() => toggleTextVisibility(accommodation.id)}
                                        >
                                            <div
                                                className={cn(
                                                    "p-4 transition-transform duration-300 ease-in-out",
                                                    isTextVisible ? "translate-y-0" : "translate-y-full"
                                                )}
                                            >
                                                <h3 className="font-bold text-2xl">{accommodation.name}</h3>
                                                <p className="text-sm text-white/80 mt-1 italic">"{accommodation.description}"</p>
                                                <div className="flex items-center gap-1.5 mt-3">
                                                    <MapPin className="h-4 w-4 text-white/90" />
                                                    <span className="font-semibold text-sm">Séjour à {getCity(accommodation.location)}, {getCountry(accommodation.location)}</span>
                                                </div>
                                                <div className="flex justify-between items-end mt-3">
                                                    <div className="flex gap-2 flex-wrap">
                                                        {(Array.isArray(accommodation.emotion) ? accommodation.emotion : [accommodation.emotion]).map(e => (
                                                            <Badge key={e} variant="outline" className="bg-white/20 text-white border-none">
                                                                {e}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-white/70">{format(parseISO(accommodation.date), "d MMM yyyy", { locale: fr })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <CardHeader className="flex flex-row items-start gap-4">
                                            <div className="flex-grow">
                                                <CardTitle className="text-2xl">{accommodation.name}</CardTitle>
                                                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                                                    <MapPin className="h-4 w-4" />
                                                    Séjour à {getCity(accommodation.location)}, {getCountry(accommodation.location)}
                                                </p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <EditAccommodationDialog accommodationToEdit={accommodation}>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            <span>Modifier</span>
                                                        </DropdownMenuItem>
                                                    </EditAccommodationDialog>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Supprimer</span>
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Supprimer ce logement ?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Cette action est irréversible.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(accommodation.id)}>
                                                                    Supprimer
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <p className="text-foreground/80 italic mb-4">"{accommodation.description}"</p>
                                            <div className="text-xs text-muted-foreground flex justify-between items-center">
                                                <span>{format(parseISO(accommodation.date), "d MMMM yyyy", { locale: fr })}</span>
                                                <div className="flex gap-2 flex-wrap">
                                                    {(Array.isArray(accommodation.emotion) ? accommodation.emotion : [accommodation.emotion]).map(e => (
                                                        <Badge key={e} variant="outline">{e}</Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </>
                                )}
                            </Card>
                        );
                    })}
                </div>
            ) : accommodations.length > 0 ? (
                /* Empty state when country filter has no matches */
                <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-card/50 p-6 space-y-3">
                    <p className="text-muted-foreground font-medium">Aucun logement trouvé pour ce pays ou critère.</p>
                    <p className="text-xs text-muted-foreground/80">
                        Essayez de sélectionner un autre pays ou réinitialisez les filtres.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedCountry(null);
                            setCountryQuery("");
                        }}
                        className="gap-2 mt-2"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Réinitialiser la recherche
                    </Button>
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-xl">
                    <p className="text-muted-foreground">Aucun logement enregistré pour le moment.</p>
                    <p className="text-sm text-muted-foreground/80 mt-2">
                        Utilisez le bouton '+' et l'icône de maison pour en ajouter un.
                    </p>
                </div>
            )}
        </div>
    );
}
