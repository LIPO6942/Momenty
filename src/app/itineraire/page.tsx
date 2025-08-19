
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { generateItinerary, type GenerateItineraryOutput, type GenerateItineraryInput } from '@/ai/flows/generate-itinerary-flow';
import type { Trip, Itinerary } from '@/lib/types';
import { Loader2, Wand2, Route, Calendar, Users, Building, Flag, Clock, Utensils, Landmark, ShoppingBag, Leaf, FerrisWheel, Sparkles, Bookmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { saveItinerary } from '@/lib/firestore';
import { useAuth } from '@/context/auth-context';


const activityIcons: { [key: string]: React.ReactNode } = {
    Musée: <Landmark className="h-5 w-5 text-orange-500" />,
    Monument: <Landmark className="h-5 w-5 text-orange-500" />,
    Restaurant: <Utensils className="h-5 w-5 text-yellow-500" />,
    Activité: <FerrisWheel className="h-5 w-5 text-rose-500" />,
    Parc: <Leaf className="h-5 w-5 text-green-500" />,
    Shopping: <ShoppingBag className="h-5 w-5 text-blue-500" />,
    Autre: <Sparkles className="h-5 w-5 text-purple-500" />,
};


const ItinerarySkeleton = () => (
    <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-muted rounded-full animate-pulse"></div>
                    <div className="w-0.5 h-full bg-muted animate-pulse mt-2"></div>
                </div>
                <div className="flex-1 space-y-4 pt-2">
                    <div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div>
                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                    <div className="space-y-3 pt-2">
                        <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
                        <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        ))}
    </div>
)

const Timeline = (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className={cn("flex flex-col", props.className)} />
);
const TimelineItem = (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li {...props} className={cn("relative flex gap-4 pb-8", props.className)} />
);
const TimelineConnector = (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} className={cn("absolute left-4 top-5 -ml-px mt-1 h-full w-0.5 bg-border", props.className)} />
);
const TimelineHeader = (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} className={cn("flex items-center gap-4", props.className)} />
);
const TimelineIcon = (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} className={cn("flex items-center justify-center z-10", props.className)} />
);
const TimelineTitle = (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className={cn("font-semibold text-base", props.className)} />
);
const TimelineBody = (props: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props} className={cn("pl-[4.5rem] -mt-4", props.className)} />
);


export default function ItineraryPage() {
    const { user } = useAuth();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [itinerary, setItinerary] = useState<GenerateItineraryOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const savedTrip = localStorage.getItem('activeTrip');
        if (savedTrip) {
            setTrip(JSON.parse(savedTrip));
        }
    }, []);

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
        try {
            const input: GenerateItineraryInput = {
                country: trip.location,
                cities: trip.citiesToVisit || [],
                startDate: trip.startDate,
                endDate: trip.endDate,
                companionType: trip.companionType,
                companionName: trip.companionName,
            };
            const result = await generateItinerary(input);
            setItinerary(result);
            toast({ title: 'Votre itinéraire est prêt !' });
        } catch (error) {
            console.error('Failed to generate itinerary:', error);
            toast({
                variant: 'destructive',
                title: 'La génération a échoué.',
                description: "L'IA n'a pas pu créer d'itinéraire. Veuillez réessayer.",
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
                createdAt: new Date().toISOString(),
                userId: user.uid,
            };
            await saveItinerary(user.uid, itineraryToSave);
            toast({ title: 'Itinéraire sauvegardé !', description: 'Retrouvez-le dans "Mes Itinéraires".' });
        } catch (error) {
            console.error('Failed to save itinerary:', error);
            toast({ variant: 'destructive', title: 'La sauvegarde a échoué.' });
        } finally {
            setIsSaving(false);
        }
    }


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
                     <div className="space-y-4">
                        <div className='text-center'>
                             <h2 className="text-2xl font-bold">{itinerary.title}</h2>
                             <Button onClick={handleSaveItinerary} variant="outline" size="sm" className="mt-4" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Bookmark className="mr-2 h-4 w-4"/>}
                                {isSaving ? "Sauvegarde..." : "Sauvegarder cet itinéraire"}
                             </Button>
                        </div>
                        <Timeline>
                            {itinerary.itinerary.map((dayPlan, index) => (
                                <TimelineItem key={dayPlan.day}>
                                    <TimelineConnector />
                                    <TimelineHeader>
                                        <TimelineIcon>
                                            <div className={cn(
                                                "font-bold text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm",
                                                cityColors[dayPlan.city] || 'bg-primary'
                                            )}>
                                                {dayPlan.day}
                                            </div>
                                        </TimelineIcon>
                                        <div className="flex flex-col">
                                            <TimelineTitle>{dayPlan.theme}</TimelineTitle>
                                            <p className="text-sm text-muted-foreground">{dayPlan.date} - {dayPlan.city}</p>
                                        </div>
                                    </TimelineHeader>
                                    <TimelineBody className="space-y-3">
                                        {dayPlan.activities.map((activity, actIndex) => (
                                            <Card key={actIndex} className="shadow-sm">
                                                <CardContent className="p-3 flex items-start gap-4">
                                                    <div className="pt-1">{activityIcons[activity.type] || <Sparkles className="h-5 w-5" />}</div>
                                                    <div className="flex-grow">
                                                        <p className="font-semibold text-sm">{activity.description}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" /> {activity.time}</p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </TimelineBody>
                                </TimelineItem>
                            ))}
                        </Timeline>
                    </div>
                )}
            </div>
        </div>
    );
}

    