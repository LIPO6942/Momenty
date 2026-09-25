"use client";

import { useContext, useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import type { Dish } from "@/lib/types";
import { getPhotoFraming } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { MapPin, Trash2, Utensils, Edit, MoreVertical, Search, X, RotateCcw } from "lucide-react";
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

    // Filtered dishes
    const filteredDishes = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return dishes;

        return dishes.filter((dish) => {
            const matchDish = (dish.name && dish.name.toLowerCase().includes(q)) ||
                              (dish.description && dish.description.toLowerCase().includes(q));
            const matchRestaurant = (dish.location && dish.location.toLowerCase().includes(q)) ||
                                    (dish.city && dish.city.toLowerCase().includes(q));

            if (searchFilter === "dishes") return matchDish;
            if (searchFilter === "restaurants") return matchRestaurant;
            return matchDish || matchRestaurant;
        });
    }, [dishes, searchQuery, searchFilter]);

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
            <div className="py-12 space-y-2">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Utensils className="h-8 w-8 text-primary" />
                    Mes Plats
                </h1>
                <p className="text-muted-foreground">Les saveurs qui ont marqué votre voyage.</p>
            </div>

            {/* Barre de recherche et filtres Plats / Restaurants */}
            {dishes.length > 0 && (
                <div className="mb-6 space-y-3 bg-card border rounded-2xl p-3.5 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={
                                searchFilter === "dishes"
                                    ? "Rechercher par nom de plat..."
                                    : searchFilter === "restaurants"
                                    ? "Rechercher par restaurant, ville ou lieu..."
                                    : "Rechercher un plat, restaurant, lieu..."
                            }
                            className="pl-10 pr-9 bg-muted/40 border-muted rounded-xl text-sm h-10"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                                title="Effacer la recherche"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                        <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-muted/50">
                            <button
                                type="button"
                                onClick={() => setSearchFilter("all")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg font-medium transition-all",
                                    searchFilter === "all"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Tous ({dishes.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setSearchFilter("dishes")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg font-medium transition-all",
                                    searchFilter === "dishes"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Plats
                            </button>
                            <button
                                type="button"
                                onClick={() => setSearchFilter("restaurants")}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg font-medium transition-all",
                                    searchFilter === "restaurants"
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Restaurants
                            </button>
                        </div>

                        <span className="text-muted-foreground font-medium pr-1">
                            {filteredDishes.length} {filteredDishes.length > 1 ? "plats trouvés" : "plat trouvé"}
                        </span>
                    </div>
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
                                                        <span>Dégusté à {getCity(dish.location)}, {getCountry(dish.location)}</span>
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
                                                        Dégusté à {getCity(dish.location)}, {getCountry(dish.location)}
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
