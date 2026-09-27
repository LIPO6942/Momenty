"use client";

import { useContext, useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import type { Dish } from "@/lib/types";
import { getPhotoFraming } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Trash2, Utensils, Edit, MoreVertical, Search, X, RotateCcw, Globe } from "lucide-react";
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
import { cn, getCity, getCountry, getFlagEmoji, isRecognizedCountry } from "@/lib/utils";
import { EditDishDialog } from "@/components/timeline/edit-dish-dialog";
import { clTransform, buildTransformFromDisplay } from "@/lib/cloudinary";
import { ImageLightbox } from "@/components/ui/image-lightbox";

export default function PlatsPage() {
    return (
        <Suspense fallback={<div className="container mx-auto max-w-2xl px-4 py-32 text-center">Chargement des plats...</div>}>
            <PlatsContent />
        </Suspense>
    );
}

function PlatsContent() {
    const { dishes, deleteDish } = useContext(TimelineContext);
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const [textVisibility, setTextVisibility] = useState<{ [key: string]: boolean }>({});
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [activeDishForEdit, setActiveDishForEdit] = useState<Dish | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchFilter, setSearchFilter] = useState<"all" | "dishes" | "restaurants">("all");
    const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

    // Détermine le pays authentifié et reconnu d'un plat (évite de confondre les noms de restaurants avec des pays)
    const getDishCountry = (dish: Dish): string => {
        // 1. Pays explicite et reconnu
        if (dish.country && isRecognizedCountry(dish.country)) {
            return getCountry(dish.country);
        }
        // 2. Pays reconnu déduit de la ville
        if (dish.city) {
            const cityCountry = getCountry(dish.city);
            if (cityCountry && isRecognizedCountry(cityCountry)) {
                return cityCountry;
            }
        }
        // 3. Pays reconnu déduit de l'adresse/lieu
        if (dish.location) {
            const locCountry = getCountry(dish.location);
            if (locCountry && isRecognizedCountry(locCountry)) {
                return locCountry;
            }
        }
        // 4. Par défaut en Tunisie
        return "Tunisie";
    };

    // Compute list of unique recognized countries with counts
    const countryStats = useMemo(() => {
        const counts: Record<string, number> = {};
        dishes.forEach((dish) => {
            const country = getDishCountry(dish);
            if (country && isRecognizedCountry(country)) {
                counts[country] = (counts[country] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([country, count]) => ({ country, count }))
            .sort((a, b) => b.count - a.count);
    }, [dishes]);

    useEffect(() => {
        const id = searchParams.get('id');
        if (id) {
            setHighlightedId(id);
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            // Clear highlight after a few seconds
            const timer = setTimeout(() => setHighlightedId(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, dishes]);

    const handleDelete = (id: string) => {
        deleteDish(id);
        toast({
            title: "Plat supprimé",
            description: "Le souvenir de ce plat a été retiré de votre journal.",
        });
    };

    const toggleTextVisibility = (id: string) => {
        setTextVisibility(prev => ({
            ...prev,
            [id]: !(prev[id] ?? true) // Default to true (visible)
        }));
    };

    const getDishLocationText = (dish: Dish): string => {
        const restaurant = dish.location?.trim();
        const city = dish.city?.trim() || getCity(dish.location);
        const country = getDishCountry(dish);

        if (restaurant && (city || country)) {
            const zoneInfo = [city, country].filter(Boolean).join(", ");
            if (city && restaurant.toLowerCase().includes(city.toLowerCase())) {
                return country && !restaurant.toLowerCase().includes(country.toLowerCase())
                    ? `${restaurant}, ${country}`
                    : restaurant;
            }
            return `${restaurant} (${zoneInfo})`;
        }
        if (restaurant) return restaurant;
        return [city, country].filter(Boolean).join(", ") || "Lieu non précisé";
    };

    // Filtered dishes (sorted chronologically descending)
    const filteredDishes = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        const base = dishes.filter((dish) => {
            const dishCountry = getDishCountry(dish);

            // Filter by selectedCountry if set
            if (selectedCountry && dishCountry.toLowerCase() !== selectedCountry.toLowerCase()) {
                return false;
            }

            // Filter by search query
            if (q) {
                const matchDish = (dish.name && dish.name.toLowerCase().includes(q)) ||
                                  (dish.description && dish.description.toLowerCase().includes(q));
                const matchRestaurant = (dish.location && dish.location.toLowerCase().includes(q)) ||
                                        (dish.city && dish.city.toLowerCase().includes(q));
                const matchCountry = dishCountry.toLowerCase().includes(q);

                if (searchFilter === "dishes") return matchDish;
                if (searchFilter === "restaurants") return matchRestaurant || matchCountry;
                return matchDish || matchRestaurant || matchCountry;
            }

            return true;
        });

        return [...base].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [dishes, searchQuery, searchFilter, selectedCountry]);

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
            <div className="py-12 space-y-2">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Utensils className="h-8 w-8 text-primary" />
                    Mes Plats
                </h1>
                <p className="text-muted-foreground">Les saveurs qui ont marqué votre voyage.</p>
            </div>

            {/* Barre de recherche discrète et filtres par pays */}
            {dishes.length > 0 && (
                <div className="mb-6 space-y-2.5">
                    {/* Ligne recherche avec sélecteur de type compact */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={
                                    searchFilter === "dishes"
                                        ? "Rechercher par plat..."
                                        : searchFilter === "restaurants"
                                        ? "Rechercher par lieu, resto, pays..."
                                        : "Rechercher un plat, restaurant, pays..."
                                }
                                className="pl-9 pr-8 bg-muted/25 hover:bg-muted/40 focus:bg-background border-border/30 focus:border-primary/40 rounded-full text-xs h-9 transition-colors placeholder:text-muted-foreground/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors rounded-full"
                                    title="Effacer la recherche"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Sélecteur de type compact */}
                        <div className="flex items-center p-0.5 bg-muted/25 rounded-full border border-border/30 shrink-0 text-[11px]">
                            <button
                                type="button"
                                onClick={() => setSearchFilter("all")}
                                className={cn(
                                    "px-2.5 py-1 rounded-full font-medium transition-all",
                                    searchFilter === "all"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Tout
                            </button>
                            <button
                                type="button"
                                onClick={() => setSearchFilter("dishes")}
                                className={cn(
                                    "px-2.5 py-1 rounded-full font-medium transition-all",
                                    searchFilter === "dishes"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Plats
                            </button>
                            <button
                                type="button"
                                onClick={() => setSearchFilter("restaurants")}
                                className={cn(
                                    "px-2.5 py-1 rounded-full font-medium transition-all",
                                    searchFilter === "restaurants"
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Lieux
                            </button>
                        </div>
                    </div>

                    {/* Chips de pays avec drapeaux miniatures */}
                    {countryStats.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
                            <button
                                type="button"
                                onClick={() => setSelectedCountry(null)}
                                className={cn(
                                    "px-2.5 py-1 rounded-full font-medium transition-all shrink-0 flex items-center gap-1 text-xs",
                                    selectedCountry === null
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border/30"
                                )}
                            >
                                <span>🌍</span>
                                <span>Tous les pays ({dishes.length})</span>
                            </button>
                            {countryStats.map(({ country, count }) => {
                                const flag = getFlagEmoji(country) || "🌍";
                                return (
                                    <button
                                        key={country}
                                        type="button"
                                        onClick={() => setSelectedCountry(selectedCountry === country ? null : country)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-full font-medium transition-all shrink-0 flex items-center gap-1.5 text-xs",
                                            selectedCountry === country
                                                ? "bg-primary text-primary-foreground shadow-xs"
                                                : "bg-muted/30 hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-border/30"
                                        )}
                                    >
                                        <span className="text-xs leading-none">{flag}</span>
                                        <span>{country}</span>
                                        <span className="opacity-60 text-[10px]">({count})</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Ligne discrète de statut et réinitialisation */}
                    {(selectedCountry || searchQuery || searchFilter !== "all") && (
                        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 pt-0.5">
                            <span>
                                {filteredDishes.length} {filteredDishes.length > 1 ? "plats trouvés" : "plat trouvé"}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCountry(null);
                                    setSearchQuery("");
                                    setSearchFilter("all");
                                }}
                                className="text-primary hover:underline flex items-center gap-1 font-medium transition-colors"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Réinitialiser les filtres
                            </button>
                        </div>
                    )}
                </div>
            )}

            {filteredDishes.length > 0 ? (
                <div className="grid md:grid-cols-1 gap-8">
                    {filteredDishes.map((dish) => {
                        const isTextVisible = textVisibility[dish.id] ?? true;
                        return (
                            <Card 
                                key={dish.id} 
                                id={dish.id}
                                className={cn(
                                    "overflow-hidden rounded-xl border-none shadow-md shadow-slate-200/80 relative text-white transition-all duration-500",
                                    highlightedId === dish.id && "ring-4 ring-primary ring-offset-4 scale-[1.02] shadow-2xl z-10"
                                )}
                            >
                                {dish.photo ? (
                                    <>
                                        {(() => {
                                            const t = buildTransformFromDisplay(dish.displayTransform);
                                            const f0 = getPhotoFraming(dish.displayTransform, 0);
                                            const f1 = getPhotoFraming(dish.displayTransform, 1);

                                            return dish.photo2 ? (
                                                /* Two photos: side by side grid with individual framing & zoom */
                                                <div className="grid grid-cols-2 gap-0.5">
                                                    <ImageLightbox
                                                        photos={[dish.photo, dish.photo2]}
                                                        initialIndex={0}
                                                        alt={`Photo 1 de ${dish.name}`}
                                                        width={t.w}
                                                        height={t.h}
                                                    >
                                                        <div className="w-full h-[280px] overflow-hidden relative">
                                                            <Image
                                                                src={clTransform(dish.photo, { w: t.w, h: t.h, c: 'fill', g: 'auto' })}
                                                                alt={`Photo 1 de ${dish.name}`}
                                                                width={400}
                                                                height={400}
                                                                className="w-full h-full object-cover transition-transform duration-300"
                                                                style={{
                                                                    objectPosition: `${f0.positionX}% ${f0.positionY}%`,
                                                                    transform: f0.zoom > 1 ? `scale(${f0.zoom})` : undefined,
                                                                    transformOrigin: `${f0.positionX}% ${f0.positionY}%`,
                                                                }}
                                                                data-ai-hint="food dish"
                                                            />
                                                        </div>
                                                    </ImageLightbox>
                                                    <ImageLightbox
                                                        photos={[dish.photo, dish.photo2]}
                                                        initialIndex={1}
                                                        alt={`Photo 2 de ${dish.name}`}
                                                        width={t.w}
                                                        height={t.h}
                                                    >
                                                        <div className="w-full h-[280px] overflow-hidden relative">
                                                            <Image
                                                                src={clTransform(dish.photo2, { w: t.w, h: t.h, c: 'fill', g: 'auto' })}
                                                                alt={`Photo 2 de ${dish.name}`}
                                                                width={400}
                                                                height={400}
                                                                className="w-full h-full object-cover transition-transform duration-300"
                                                                style={{
                                                                    objectPosition: `${f1.positionX}% ${f1.positionY}%`,
                                                                    transform: f1.zoom > 1 ? `scale(${f1.zoom})` : undefined,
                                                                    transformOrigin: `${f1.positionX}% ${f1.positionY}%`,
                                                                }}
                                                                data-ai-hint="food dish"
                                                            />
                                                        </div>
                                                    </ImageLightbox>
                                                </div>
                                            ) : (
                                                /* Single photo: full width with framing & zoom */
                                                <ImageLightbox
                                                    src={clTransform(dish.photo, { w: t.w, h: t.h, c: t.c, g: t.g })}
                                                    alt={`Photo de ${dish.name}`}
                                                    width={t.w}
                                                    height={t.h}
                                                >
                                                    <div className="w-full h-[400px] overflow-hidden relative">
                                                        <Image
                                                            src={clTransform(dish.photo, { w: t.w, h: t.h, c: t.c, g: t.g })}
                                                            alt={`Photo de ${dish.name}`}
                                                            width={t.w}
                                                            height={t.h}
                                                            className={cn("w-full h-full", t.c === 'fit' ? "object-contain" : "object-cover")}
                                                            style={{
                                                                objectPosition: `${f0.positionX}% ${f0.positionY}%`,
                                                                transform: f0.zoom > 1 ? `scale(${f0.zoom})` : undefined,
                                                                transformOrigin: `${f0.positionX}% ${f0.positionY}%`,
                                                            }}
                                                            data-ai-hint="food dish"
                                                        />
                                                    </div>
                                                </ImageLightbox>
                                            );
                                        })()}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>

                                        <div className="absolute top-2 right-2 flex gap-2 z-20">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 shrink-0 text-white/80 hover:text-white hover:bg-white/10 focus-visible:text-white"
                                                onClick={() => {
                                                    setActiveDishForEdit(dish);
                                                    setIsEditDialogOpen(true);
                                                }}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white/80 hover:text-white hover:bg-white/10 focus-visible:text-white">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Supprimer ce plat ?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Cette action est irréversible et supprimera définitivement le souvenir de ce plat de votre journal.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(dish.id)}>
                                                            Supprimer
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>

                                        <div
                                            className="absolute bottom-0 left-0 w-full cursor-pointer transition-opacity duration-300"
                                            onClick={() => toggleTextVisibility(dish.id)}
                                        >
                                            <div
                                                className={cn(
                                                    "p-4 transition-transform duration-300 ease-in-out",
                                                    isTextVisible ? "translate-y-0" : "translate-y-full"
                                                )}
                                            >
                                                <h3 className="font-bold text-2xl">{dish.name}</h3>
                                                <p className="text-sm text-white/80 mt-1 italic">"{dish.description}"</p>
                                                <div className="mt-3 space-y-0.5">
                                                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                                                        <MapPin className="h-4 w-4 text-white/90 shrink-0" />
                                                        <span>Dégusté à {getDishLocationText(dish)}</span>
                                                        {(() => {
                                                            const c = getDishCountry(dish);
                                                            const flag = c ? getFlagEmoji(c) : "";
                                                            return flag ? <span className="text-sm leading-none shrink-0">{flag}</span> : null;
                                                        })()}
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-end mt-3">
                                                    <div className="flex gap-2 flex-wrap">
                                                        {(Array.isArray(dish.emotion) ? dish.emotion : [dish.emotion]).map(e => (
                                                            <Badge key={e} variant="outline" className="bg-white/20 text-white border-none">
                                                                {e}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-white/70">{format(parseISO(dish.date), "d MMM yyyy", { locale: fr })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <CardHeader className="flex flex-row items-start gap-4">
                                            <div className="flex-grow">
                                                <CardTitle className="text-2xl">{dish.name}</CardTitle>
                                                <div className="mt-1 space-y-0.5">
                                                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                                                        <MapPin className="h-4 w-4 shrink-0" />
                                                        <span>Dégusté à {getDishLocationText(dish)}</span>
                                                        {(() => {
                                                            const c = getDishCountry(dish);
                                                            const flag = c ? getFlagEmoji(c) : "";
                                                            return flag ? <span className="text-sm leading-none shrink-0">{flag}</span> : null;
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onSelect={() => {
                                                        setActiveDishForEdit(dish);
                                                        setIsEditDialogOpen(true);
                                                    }}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Modifier</span>
                                                    </DropdownMenuItem>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                <span>Supprimer</span>
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Supprimer ce plat ?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Cette action est irréversible.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(dish.id)}>
                                                                    Supprimer
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <p className="text-foreground/80 italic mb-4">"{dish.description}"</p>
                                            <div className="text-xs text-muted-foreground flex justify-between items-center">
                                                <span>{format(parseISO(dish.date), "d MMMM yyyy", { locale: fr })}</span>
                                                <div className="flex gap-2 flex-wrap">
                                                    {(Array.isArray(dish.emotion) ? dish.emotion : [dish.emotion]).map(e => (
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
            ) : dishes.length > 0 ? (
                /* Empty state when filtering */
                <div className="text-center py-16 border-2 border-dashed rounded-2xl bg-card/50 p-6 space-y-3">
                    <p className="text-muted-foreground font-medium">Aucun résultat trouvé pour votre recherche.</p>
                    <p className="text-xs text-muted-foreground/80">
                        Essayez de chercher un autre plat ou restaurant, ou réinitialisez les filtres.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setSelectedCountry(null);
                            setSearchQuery("");
                            setSearchFilter("all");
                        }}
                        className="gap-2 mt-2"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Réinitialiser la recherche
                    </Button>
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-xl">
                    <p className="text-muted-foreground">Aucun plat enregistré pour le moment.</p>
                    <p className="text-sm text-muted-foreground/80 mt-2">
                        Utilisez le bouton '+' et l'icône de plat pour en ajouter un.
                    </p>
                </div>
            )}
            {activeDishForEdit && (
                <EditDishDialog 
                    open={isEditDialogOpen} 
                    onOpenChange={setIsEditDialogOpen} 
                    dishToEdit={activeDishForEdit} 
                />
            )}
        </div>
    );
}
