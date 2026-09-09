
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { GenerateItineraryInput } from '@/ai/flows/generate-itinerary-flow';
import type { Trip, Itinerary, ItineraryOutput } from '@/lib/types';
import { Loader2, Wand2, Route, Calendar, Users, Building, Flag, Clock, Utensils, Landmark, ShoppingBag, Leaf, FerrisWheel, Sparkles, Bookmark, PartyPopper, Waves, Train, Car, Plane, Bus, Ship, Check, BookmarkCheck, Edit3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { saveItinerary } from '@/lib/firestore';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from "@/components/ui/skeleton";
import { getDestinationAssets } from '@/lib/destination-assets';
import { EditTitleDialog } from '@/components/itinerary/edit-title-dialog';
import Link from 'next/link';


const activityIcons: { [key: string]: React.ReactNode } = {
    Musée: <Landmark className="h-5 w-5 text-orange-500" />,
    Monument: <Landmark className="h-5 w-5 text-orange-500" />,
    Restaurant: <Utensils className="h-5 w-5 text-yellow-500" />,
    Activité: <FerrisWheel className="h-5 w-5 text-rose-500" />,
    Parc: <Leaf className="h-5 w-5 text-green-500" />,
    Shopping: <ShoppingBag className="h-5 w-5 text-blue-500" />,
    Soirée: <PartyPopper className="h-5 w-5 text-indigo-500" />,
    Baignade: <Waves className="h-5 w-5 text-cyan-500" />,
    Autre: <Sparkles className="h-5 w-5 text-purple-500" />,
};

const transportIcons: { [key: string]: React.ReactNode } = {
    Train: <Train className="h-5 w-5" />,
    Avion: <Plane className="h-5 w-5" />,
    Voiture: <Car className="h-5 w-5" />,
    Bus: <Bus className="h-5 w-5" />,
    Bateau: <Ship className="h-5 w-5" />,
}


const ItinerarySkeleton = () => (
    <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="relative pl-8">
                <div className="absolute left-0 h-full w-0.5 bg-muted"></div>
                <div className="absolute left-[-0.6rem] top-1 h-5 w-5 rounded-full bg-muted animate-pulse"></div>
                <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="mt-4 space-y-3">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                </div>
            </div>
        ))}
    </div>
)


export default function ItineraryPage() {
    const { user } = useAuth();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [itinerary, setItinerary] = useState<ItineraryOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const savedTrip = localStorage.getItem('activeTrip');
        if (savedTrip) {
            setTrip(JSON.parse(savedTrip));
        }
    }, []);

    const destinationAssets = useMemo(() => {
        const loc = trip?.location || itinerary?.itinerary?.[0]?.city || '';
        return getDestinationAssets(loc);
    }, [trip?.location, itinerary]);

    const handleGenerateItinerary = async () => {
        if (!trip?.location || !trip.startDate || !trip.endDate) {
            toast({
                variant: 'destructive',
                title: 'Informations manquantes',
                description: 'Veuillez définir un pays et des dates dans le mode Voyage.',
            });
            return;
        }

        setIsLoading(true);
        setItinerary(null);
        setIsSaved(false);
        setSavedItineraryId(null);
        try {
            const input: GenerateItineraryInput = {
                country: trip.location,
                cities: trip.citiesToVisit || [],
                startDate: trip.startDate,
                endDate: trip.endDate,
                companionType: trip.companionType,
                companionName: trip.companionName,
            };

            const res = await fetch('/api/itineraries/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(input),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.error || "L'IA n'a pas pu créer d'itinéraire.");
            }

            setItinerary(data.itinerary);
            toast({ title: 'Votre itinéraire est prêt !' });
        } catch (error: any) {
            console.error('Failed to generate itinerary:', error);
            toast({
                variant: 'destructive',
                title: 'La génération a échoué.',
                description: error?.message || "L'IA n'a pas pu créer d'itinéraire. Veuillez réessayer.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSaveItinerary = async () => {
        if (!itinerary || !trip || !user) return;

        setIsSaving(true);
        try {
            const itineraryToSave: Itinerary = {
                ...itinerary,
                ...trip,
                countryCode: itinerary.countryCode || destinationAssets.countryCode,
                countryFlagUrl: itinerary.countryFlagUrl || destinationAssets.flagUrl,
                coverImageUrl: itinerary.coverImageUrl || destinationAssets.clichePhoto,
                landmarkName: itinerary.landmarkName || destinationAssets.landmarkName,
                createdAt: new Date().toISOString(),
                userId: user.uid,
            };
            const docId = await saveItinerary(user.uid, itineraryToSave, savedItineraryId || undefined);
            if (docId) {
                setSavedItineraryId(docId);
            }
            setIsSaved(true);
            toast({ title: 'Itinéraire sauvegardé !', description: 'Retrouvez-le dans "Mes Itinéraires".' });
        } catch (error) {
            console.error('Failed to save itinerary:', error);
            toast({ variant: 'destructive', title: 'La sauvegarde a échoué.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRenameItinerary = async (newTitle: string) => {
        if (!itinerary) return;
        const updated = { ...itinerary, title: newTitle };
        setItinerary(updated);

        // Si l'itinéraire a déjà été enregistré, on le met à jour en direct dans Firestore
        if (savedItineraryId && user && trip) {
            try {
                const itineraryToUpdate: Itinerary = {
                    ...updated,
                    ...trip,
                    countryCode: updated.countryCode || destinationAssets.countryCode,
                    countryFlagUrl: updated.countryFlagUrl || destinationAssets.flagUrl,
                    coverImageUrl: updated.coverImageUrl || destinationAssets.clichePhoto,
                    landmarkName: updated.landmarkName || destinationAssets.landmarkName,
                    createdAt: new Date().toISOString(),
                    userId: user.uid,
                };
                await saveItinerary(user.uid, itineraryToUpdate, savedItineraryId);
                toast({ title: 'Titre de l\'itinéraire mis à jour !' });
            } catch (err) {
                console.error('Failed to update itinerary title in firestore:', err);
                toast({ variant: 'destructive', title: 'Erreur lors de la mise à jour du titre.' });
            }
        } else {
            toast({ title: 'Titre renommé !', description: 'Pensez à sauvegarder votre itinéraire.' });
        }
    };


    const tripDuration = useMemo(() => {
        if (!trip?.startDate || !trip.endDate) return 0;
        return differenceInDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1;
    }, [trip]);

    const cityColors = useMemo(() => {
        if (!itinerary) return {};
        const uniqueCities = [...new Set(itinerary.itinerary.map(day => day.city))];
        const colors = ["bg-[hsl(var(--chart-1))]", "bg-[hsl(var(--chart-2))]", "bg-[hsl(var(--chart-3))]", "bg-[hsl(var(--chart-4))]", "bg-[hsl(var(--chart-5))]"];
        const cityColorMap: { [city: string]: string } = {};
        
        uniqueCities.forEach((city, index) => {
            cityColorMap[city] = colors[index % colors.length];
        });
        return cityColorMap;

    }, [itinerary]);


    return (
        <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
            <div className="py-16 space-y-2">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Route className="h-8 w-8 text-primary"/>
                    Mon Itinéraire
                </h1>
                <p className="text-muted-foreground">Laissez l'IA planifier votre prochaine aventure.</p>
            </div>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Détails du voyage</CardTitle>
                    <CardDescription>Informations utilisées pour générer votre itinéraire personnalisé.</CardDescription>
                </CardHeader>
                {trip ? (
                    <CardContent className="grid grid-cols-2 gap-x-4 gap-y-6">
                       <div className="flex items-start gap-3">
                           <Flag className="h-5 w-5 mt-1 text-primary"/>
                           <div>
                               <p className="text-sm text-muted-foreground">Pays</p>
                               <p className="font-semibold">{trip.location}</p>
                           </div>
                       </div>
                       <div className="flex items-start gap-3">
                           <Calendar className="h-5 w-5 mt-1 text-primary"/>
                           <div>
                               <p className="text-sm text-muted-foreground">Durée</p>
                               <p className="font-semibold">{tripDuration} jours</p>
                               <p className="text-xs text-muted-foreground">{format(parseISO(trip.startDate!), "d MMM", {locale: fr})} - {format(parseISO(trip.endDate!), "d MMM yyyy", {locale: fr})}</p>
                           </div>
                       </div>
                       {trip.citiesToVisit && trip.citiesToVisit.length > 0 && (
                             <div className="flex items-start gap-3 col-span-2">
                                <Building className="h-5 w-5 mt-1 text-primary"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Villes</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {trip.citiesToVisit.map(city => (
                                            <Badge key={city.name} variant="secondary">{city.name} ({city.days}j)</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                       )}
                       <div className="flex items-start gap-3 col-span-2">
                           <Users className="h-5 w-5 mt-1 text-primary"/>
                           <div>
                               <p className="text-sm text-muted-foreground">Compagnon(s)</p>
                               <p className="font-semibold">{trip.companionType === 'Solo' ? 'En solo' : `${trip.companionType}${trip.companionName ? ` : ${trip.companionName}` : ''}`}</p>
                           </div>
                       </div>

                       <div className="col-span-2">
                           <Button onClick={handleGenerateItinerary} disabled={isLoading} className="w-full">
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Wand2 className="mr-2 h-4 w-4" />
                                )}
                                {itinerary ? "Régénérer l'itinéraire" : "Générer mon itinéraire"}
                            </Button>
                       </div>
                    </CardContent>
                ) : (
                    <CardContent>
                        <p className="text-muted-foreground text-center">Activez le "Mode Voyage" pour commencer.</p>
                    </CardContent>
                )}
            </Card>

            <div className="mt-8">
                {isLoading && <ItinerarySkeleton />}
                {itinerary && (
                     <div className="relative rounded-3xl overflow-hidden border border-border/80 shadow-2xl bg-card/75 backdrop-blur-md transition-all">
                        {/* Cliché landmark photo behind text with subtle transparency */}
                        <div 
                            className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none opacity-15 dark:opacity-20 scale-105 transition-all duration-700 select-none"
                            style={{ backgroundImage: `url('${itinerary.coverImageUrl || destinationAssets.clichePhoto}')` }}
                        />
                        {/* Subtle gradient overlay to guarantee perfect contrast and readability */}
                        <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/90 via-background/75 to-background/95 pointer-events-none" />

                        <div className="relative z-10 p-5 sm:p-8 space-y-6">
                            {/* Header with flag badge, title, rename button, and save action */}
                            <div className="flex flex-col items-center text-center space-y-4 pb-6 border-b border-border/50">
                                {/* Country flag badge & landmark caption */}
                                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/80 shadow-xs">
                                    <img 
                                        src={itinerary.countryFlagUrl || destinationAssets.flagUrl} 
                                        alt={destinationAssets.countryName} 
                                        className="w-6 h-4 sm:w-7 sm:h-5 object-cover rounded shadow-xs border border-white/20"
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                    />
                                    <span className="font-semibold text-sm text-foreground">
                                        {destinationAssets.countryName}
                                    </span>
                                    <span className="text-muted-foreground text-xs">•</span>
                                    <span className="text-xs text-muted-foreground font-normal italic">
                                        {itinerary.landmarkName || destinationAssets.landmarkName}
                                    </span>
                                </div>

                                {/* Title with Rename pencil button */}
                                <div className="flex items-center justify-center gap-2 max-w-xl group">
                                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                                        {itinerary.title}
                                    </h2>
                                    <EditTitleDialog currentTitle={itinerary.title} onSave={handleRenameItinerary}>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                                            title="Renommer l'itinéraire"
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </Button>
                                    </EditTitleDialog>
                                </div>

                                {/* Save Button & Mes Itinéraires link */}
                                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                    <Button 
                                        onClick={handleSaveItinerary} 
                                        variant={isSaved ? "secondary" : "default"} 
                                        size="sm" 
                                        className={cn("gap-2 shadow-sm font-medium", isSaved && "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border border-emerald-500/30")}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : isSaved ? (
                                            <Check className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <Bookmark className="h-4 w-4" />
                                        )}
                                        {isSaving ? "Sauvegarde..." : isSaved ? "Itinéraire enregistré ✓" : "Sauvegarder cet itinéraire"}
                                    </Button>

                                    {isSaved && (
                                        <Link href="/itineraires">
                                            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                                <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
                                                Voir dans Mes Itinéraires
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Days & Activities with translucent cards */}
                            <div className="space-y-8 mt-6">
                                {itinerary.itinerary.map((dayPlan) => (
                                    <div key={dayPlan.day} className="relative pl-8 sm:pl-10">
                                        <div className="absolute left-0 h-full w-0.5 bg-border/70"></div>
                                        <div className={cn(
                                            "absolute -left-2.5 sm:-left-3.5 top-1 font-bold text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm shadow-sm",
                                            cityColors[dayPlan.city] || 'bg-primary'
                                        )}>
                                            {dayPlan.day}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-lg">{dayPlan.theme}</h3>
                                            <p className="text-sm text-muted-foreground">{dayPlan.date} - {dayPlan.city}</p>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            {dayPlan.activities.map((activity, actIndex) => (
                                                <Card key={actIndex} className="shadow-sm bg-card/85 backdrop-blur-sm border-border/70 hover:bg-card/95 transition-all">
                                                    <CardContent className="p-3 flex items-start gap-3">
                                                        <div className="flex-shrink-0 pt-0.5">{activityIcons[activity.type] || <Sparkles className="h-5 w-5" />}</div>
                                                        <div className="flex-grow space-y-1">
                                                            <p className="font-medium text-sm leading-snug">{activity.description}</p>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Clock className="h-3 w-3" /> {activity.time}</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                            {dayPlan.travelInfo && (
                                                <Card className="shadow-sm bg-secondary/80 backdrop-blur-sm border-dashed">
                                                    <CardContent className="p-3 flex items-center gap-3 text-muted-foreground">
                                                        <div className="flex-shrink-0">
                                                            {transportIcons[dayPlan.travelInfo.mode] || <Route className="h-5 w-5"/>}
                                                        </div>
                                                        <p className="text-sm italic">{dayPlan.travelInfo.description}</p>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
