
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { getItineraries, deleteItinerary, saveItinerary } from "@/lib/firestore";
import type { Itinerary, DayPlan, Activity } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Calendar, Flag, Loader2, Trash2, Route, Clock, Landmark, Sparkles, Utensils, FerrisWheel, Leaf, ShoppingBag, Edit, PlusCircle, MoreVertical, PartyPopper, Waves, Save, MapPin, Train, Plane, Car, Bus, Ship } from "lucide-react";
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
  } from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { EditDayPlanDialog } from "@/components/itinerary/edit-day-plan-dialog";
import { EditActivityDialog } from "@/components/itinerary/edit-activity-dialog";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import type { LocationWithCoords } from "@/lib/types";
import { TravelInfo } from "@/lib/types";


const InteractiveMap = dynamic(() => import('@/components/map/interactive-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] md:h-[60vh] w-full rounded-lg" />
});


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


const ItineraryMapDialog = ({ itinerary, children }: { itinerary: Itinerary; children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [locationsWithCoords, setLocationsWithCoords] = useState<LocationWithCoords[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [travelSegments, setTravelSegments] = useState<{start: [number, number], end: [number, number], mode: TravelInfo['mode']}[]>([]);

    useEffect(() => {
        const fetchCoordinates = async () => {
            if (!open) return;
            setIsLoading(true);

            // Get unique cities from itinerary
            const cityNames = itinerary.itinerary.map(day => day.city);
            const uniqueCities = [...new Set(cityNames)];

            const coordsCache: { [key: string]: [number, number] } = JSON.parse(localStorage.getItem('coordsCache') || '{}');
            const newCoords: LocationWithCoords[] = [];

            for (const city of uniqueCities) {
                const locationKey = city.toLowerCase();
                if (coordsCache[locationKey]) {
                    newCoords.push({ name: city, coords: coordsCache[locationKey], count: 0, isManual: false });
                } else {
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
                        const data = await response.json();
                        if (data && data.length > 0) {
                            const { lat, lon } = data[0];
                            const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];
                            coordsCache[locationKey] = coords;
                            newCoords.push({ name: city, coords, count: 0, isManual: false });
                        }
                    } catch (error) {
                        console.error(`Failed to geocode ${city}:`, error);
                    }
                }
            }

            // Create travel segments for the polyline
            const segments: {start: [number, number], end: [number, number], mode: TravelInfo['mode']}[] = [];
            for (let i = 0; i < itinerary.itinerary.length; i++) {
                const day = itinerary.itinerary[i];
                if (day.travelInfo && i + 1 < itinerary.itinerary.length) {
                    const nextDay = itinerary.itinerary[i + 1];
                    const startCity = newCoords.find(c => c.name === day.city);
                    const endCity = newCoords.find(c => c.name === nextDay.city);
                    if (startCity && endCity && startCity.name !== endCity.name) {
                        segments.push({
                            start: startCity.coords,
                            end: endCity.coords,
                            mode: day.travelInfo.mode,
                        });
                    }
                }
            }
            setTravelSegments(segments);
            
            localStorage.setItem('coordsCache', JSON.stringify(coordsCache));
            setLocationsWithCoords(newCoords);
            setIsLoading(false);
        };

    const handleShare = async (itinerary: Itinerary) => {
        if (!user || !itinerary.id) return;
        setShareLoading(prev => ({...prev, [itinerary.id!]: true}));
        try {
            const token = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
                ? (crypto as any).randomUUID()
                : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
            const updated = { ...itinerary, shareEnabled: true, shareToken: token, sharedAt: new Date().toISOString() } as Itinerary;
            await saveItinerary(user.uid, updated, itinerary.id);
            setItineraries(prev => prev.map(it => it.id === itinerary.id ? updated : it));
            const link = `${window.location.origin}/share/itinerary/${token}`;
            await navigator.clipboard.writeText(link).catch(() => {});
            toast({ title: 'Lien de partage généré', description: 'Le lien a été copié dans le presse-papiers.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Échec du partage' });
        } finally {
            setShareLoading(prev => ({...prev, [itinerary.id!]: false}));
        }
    };

    const handleUnshare = async (itinerary: Itinerary) => {
        if (!user || !itinerary.id) return;
        setShareLoading(prev => ({...prev, [itinerary.id!]: true}));
        try {
            const updated = { ...itinerary, shareEnabled: false } as Itinerary;
            // Remove token and date on revoke
            delete (updated as any).shareToken;
            delete (updated as any).sharedAt;
            await saveItinerary(user.uid, updated, itinerary.id);
            setItineraries(prev => prev.map(it => it.id === itinerary.id ? updated : it));
            toast({ title: 'Partage révoqué' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Échec de la révocation' });
        } finally {
            setShareLoading(prev => ({...prev, [itinerary.id!]: false}));
        }
    };

        fetchCoordinates();
    }, [open, itinerary]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Carte de l'itinéraire : {itinerary.title}</DialogTitle>
                </DialogHeader>
                <div className="p-6 pt-2">
                    {isLoading ? (
                        <Skeleton className="h-[400px] md:h-[60vh] w-full rounded-lg" />
                    ) : (
                        <InteractiveMap 
                            locations={locationsWithCoords} 
                            focusedLocation={null} 
                            showPolyline={true} 
                            isNumbered={true}
                            travelSegments={travelSegments}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};


const ItineraryDisplay = ({ itinerary, onUpdateItinerary, onDeleteActivity }: { itinerary: Itinerary, onUpdateItinerary: (updatedItinerary: Itinerary) => void, onDeleteActivity: (itineraryId: string, dayIndex: number, activityIndex: number) => void }) => {

    const cityColors = useMemo(() => {
        const uniqueCities = [...new Set(itinerary.itinerary.map(day => day.city))];
        const colors = ["bg-[hsl(var(--chart-1))]", "bg-[hsl(var(--chart-2))]", "bg-[hsl(var(--chart-3))]", "bg-[hsl(var(--chart-4))]", "bg-[hsl(var(--chart-5))]"];
        const cityColorMap: { [city: string]: string } = {};
        
        uniqueCities.forEach((city, index) => {
            cityColorMap[city] = colors[index % colors.length];
        });
        return cityColorMap;
    }, [itinerary]);

    const handleUpdateDayPlan = (dayIndex: number, updatedDayPlan: DayPlan) => {
        const newDayPlans = [...itinerary.itinerary];
        newDayPlans[dayIndex] = updatedDayPlan;
        onUpdateItinerary({ ...itinerary, itinerary: newDayPlans });
    };

    const handleUpdateActivity = (dayIndex: number, activityIndex: number | null, activity: Activity) => {
        const newDayPlans = [...itinerary.itinerary];
        const newActivities = [...newDayPlans[dayIndex].activities];

        if (activityIndex !== null) {
            newActivities[activityIndex] = activity;
        } else {
            newActivities.push(activity);
        }

        newDayPlans[dayIndex] = { ...newDayPlans[dayIndex], activities: newActivities };
        onUpdateItinerary({ ...itinerary, itinerary: newDayPlans });
    };

    return (
        <div className="space-y-8">
            {itinerary.itinerary.map((dayPlan, dayIndex) => (
                <div key={dayPlan.day} className="relative pl-8 sm:pl-10">
                     <div className="absolute left-0 h-full w-0.5 bg-border/70"></div>
                     <div className={cn(
                        "absolute -left-2.5 sm:-left-3.5 top-1 font-bold text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm",
                        cityColors[dayPlan.city] || 'bg-primary'
                     )}>
                        {dayPlan.day}
                    </div>
                     <div className="flex justify-between items-start group">
                        <div className="space-y-1">
                            <h4 className="font-semibold text-lg">{dayPlan.theme}</h4>
                            <p className="text-sm text-muted-foreground">{dayPlan.date} - {dayPlan.city}</p>
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <EditDayPlanDialog 
                                dayPlan={dayPlan} 
                                onSave={(updatedDayPlan) => handleUpdateDayPlan(dayIndex, updatedDayPlan)}
                            >
                                <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                            </EditDayPlanDialog>
                             <EditActivityDialog
                                onSave={(newActivity) => handleUpdateActivity(dayIndex, null, newActivity)}
                                trigger={
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                }
                                />
                        </div>
                     </div>
                     <div className="mt-4 space-y-3">
                        {dayPlan.activities.map((activity, actIndex) => (
                            <Card key={actIndex} className="group relative shadow-sm hover:shadow-md transition-shadow duration-200">
                                 <div className="absolute top-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                    <EditActivityDialog
                                        activity={activity}
                                        onSave={(updatedActivity) => handleUpdateActivity(dayIndex, actIndex, updatedActivity)}
                                        trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3 w-3"/></Button>}
                                    />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Supprimer cette activité ?</AlertDialogTitle>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => onDeleteActivity(itinerary.id!, dayIndex, actIndex)}>
                                                    Supprimer
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

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
                            <Card className="shadow-sm bg-secondary border-dashed">
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
    );
};

const EditTitleDialog = ({ itinerary, onUpdateItinerary, children }: { itinerary: Itinerary, onUpdateItinerary: (itinerary: Itinerary) => void, children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(itinerary.title);

    useEffect(() => {
        if (open) {
            setTitle(itinerary.title);
        }
    }, [open, itinerary.title]);

    const handleSave = () => {
        onUpdateItinerary({ ...itinerary, title });
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier le titre de l'itinéraire</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                    <Button onClick={handleSave}><Save className="mr-2 h-4 w-4"/> Enregistrer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}


export default function SavedItinerariesPage() {
    const { user } = useAuth();
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<{[key: string]: boolean}>({});
    const { toast } = useToast();
    const [shareLoading, setShareLoading] = useState<{[key: string]: boolean}>({});

    const loadItineraries = async () => {
        if (user) {
            setIsLoading(true);
            const savedItineraries = await getItineraries(user.uid);
            setItineraries(savedItineraries);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if(user){
          loadItineraries();
        }
    }, [user]);

    const handleUpdateItinerary = async (updatedItinerary: Itinerary) => {
        if (!user || !updatedItinerary.id) return;
        setIsUpdating(prev => ({...prev, [updatedItinerary.id!]: true}));
        try {
            await saveItinerary(user.uid, updatedItinerary, updatedItinerary.id);
            setItineraries(prev => prev.map(it => it.id === updatedItinerary.id ? updatedItinerary : it));
            toast({ title: "Itinéraire mis à jour !" });
        } catch (error) {
            console.error("Failed to update itinerary:", error);
            toast({ variant: "destructive", title: "La mise à jour a échoué." });
        } finally {
            setIsUpdating(prev => ({...prev, [updatedItinerary.id!]: false}));
        }
    };

    const handleDeleteItinerary = async (id: string) => {
        if (!user) return;
        try {
            await deleteItinerary(user.uid, id);
            setItineraries(prev => prev.filter(it => it.id !== id));
            toast({ title: "Itinéraire supprimé." });
        } catch (error) {
            console.error("Failed to delete itinerary:", error);
            toast({ variant: "destructive", title: "La suppression a échoué." });
        }
    };

    const handleDeleteActivity = (itineraryId: string, dayIndex: number, activityIndex: number) => {
        const itineraryToUpdate = itineraries.find(it => it.id === itineraryId);
        if (!itineraryToUpdate) return;
        
        const newDayPlans = [...itineraryToUpdate.itinerary];
        const newActivities = newDayPlans[dayIndex].activities.filter((_, i) => i !== activityIndex);
        newDayPlans[dayIndex] = { ...newDayPlans[dayIndex], activities: newActivities };
        
        handleUpdateItinerary({ ...itineraryToUpdate, itinerary: newDayPlans });
    };


    const LoadingSkeleton = () => (
        <div className="space-y-4">
            <Card>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent><Skeleton className="h-4 w-1/2" /></CardContent>
            </Card>
            <Card>
                <CardHeader><Skeleton className="h-6 w-2/3" /></CardHeader>
                <CardContent><Skeleton className="h-4 w-1/2" /></CardContent>
            </Card>
        </div>
    );

    return (
        <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
            <div className="py-16 space-y-2">
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <Bookmark className="h-8 w-8 text-primary"/>
                    Mes Itinéraires
                </h1>
                <p className="text-muted-foreground">Retrouvez tous vos voyages planifiés.</p>
            </div>

            {isLoading ? (
                <LoadingSkeleton />
            ) : itineraries.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <p className="text-muted-foreground">Aucun itinéraire sauvegardé pour le moment.</p>
                        <p className="text-sm text-muted-foreground/80 mt-2">
                            Activez le mode voyage et générez un itinéraire pour commencer.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {itineraries.map((itinerary, idx) => (
                        <AccordionItem key={itinerary.id || idx} value={itinerary.id || String(idx)} className="group border-none bg-card rounded-xl shadow-md shadow-slate-200/80">
                           <div className="flex items-center p-4">
                                <AccordionTrigger className="flex-grow p-0 hover:no-underline text-left">
                                    <span className="text-xl font-semibold">{itinerary.title}</span>
                                </AccordionTrigger>
                                 <ItineraryMapDialog itinerary={itinerary}>
                                    <Button variant="ghost" size="icon" className="h-12 w-12 ml-2 text-red-500 hover:bg-red-500/10 hover:text-red-600">
                                        <MapPin className="h-6 w-6" />
                                    </Button>
                                 </ItineraryMapDialog>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 ml-2">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <EditTitleDialog itinerary={itinerary} onUpdateItinerary={handleUpdateItinerary}>
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                <span>Renommer</span>
                                            </DropdownMenuItem>
                                        </EditTitleDialog>
                                        <DropdownMenuSeparator />
                                        {itinerary.shareEnabled && itinerary.shareToken ? (
                                            <>
                                                <DropdownMenuItem onSelect={async (e) => { e.preventDefault(); try { await navigator.clipboard.writeText(`${window.location.origin}/share/itinerary/${itinerary.shareToken}`); toast({ title: 'Lien copié' }); } catch {} }}>
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    <span>Copier le lien</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleUnshare(itinerary); }} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    <span>{shareLoading[itinerary.id!] ? 'Révocation…' : 'Révoquer le partage'}</span>
                                                </DropdownMenuItem>
                                            </>
                                        ) : (
                                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleShare(itinerary); }}>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                <span>{shareLoading[itinerary.id!] ? 'Génération…' : 'Partager (générer le lien)'}</span>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                                     <Trash2 className="mr-2 h-4 w-4" />
                                                     <span>Supprimer l'itinéraire</span>
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Supprimer cet itinéraire ?</AlertDialogTitle>
                                                    <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteItinerary(itinerary.id!)}>Confirmer</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <AccordionContent className="p-4 pt-0">
                               <div className="flex justify-between items-center mb-6">
                                     <p className="text-sm text-muted-foreground">
                                        Créé le {format(parseISO(itinerary.createdAt), "d MMM yyyy", { locale: fr })}
                                    </p>
                                    {isUpdating[itinerary.id!] && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                               </div>
                                <ItineraryDisplay 
                                    itinerary={itinerary} 
                                    onUpdateItinerary={handleUpdateItinerary}
                                    onDeleteActivity={handleDeleteActivity}
                                />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
}
