
"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { getItineraries, deleteItinerary, saveItinerary } from "@/lib/firestore";
import type { Itinerary, DayPlan, Activity } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Bookmark, Calendar, Flag, Loader2, Trash2, Route, Clock, Landmark, 
    Sparkles, Utensils, FerrisWheel, Leaf, ShoppingBag, Edit, PlusCircle, 
    MoreVertical, PartyPopper, Waves, Save, MapPin, Train, Plane, Car, 
    Bus, Ship, Send, Search, Edit3, Compass, Globe, Users, ArrowRight, 
    Share2, Luggage, Check, Copy, Plus, X, Eye
} from "lucide-react";
import { getDestinationAssets } from "@/lib/destination-assets";
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
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, deleteDoc, collection } from "firebase/firestore";


const InteractiveMap = dynamic(() => import('@/components/map/interactive-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] md:h-[60vh] w-full rounded-lg" />
});

export interface TripDatesInfo {
    startDate: Date | null;
    endDate: Date | null;
    dateLabel: string;
    totalDays: number;
    status: 'upcoming' | 'ongoing' | 'past' | 'flexible';
    countdownText: string;
}

export function parseAnyDate(val: any): Date | null {
    if (!val) return null;
    try {
        if (val instanceof Date && !isNaN(val.getTime())) return val;
        if (typeof val === 'object') {
            if (typeof val.toDate === 'function') {
                const d = val.toDate();
                if (!isNaN(d.getTime())) return d;
            }
            if (typeof val.seconds === 'number') {
                const d = new Date(val.seconds * 1000);
                if (!isNaN(d.getTime())) return d;
            }
        }
        if (typeof val === 'number') {
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d;
        }
        if (typeof val === 'string') {
            const trimmed = val.trim();
            if (!trimmed) return null;
            try {
                const d = parseISO(trimmed);
                if (!isNaN(d.getTime())) return d;
            } catch {}
            const d2 = new Date(trimmed);
            if (!isNaN(d2.getTime())) return d2;
        }
    } catch {}
    return null;
}

export function safeFormatDate(date: Date | null, fmt: string): string {
    if (!date || isNaN(date.getTime())) return '';
    try {
        return format(date, fmt, { locale: fr });
    } catch {
        return '';
    }
}

export function getTripDatesInfo(itinerary: Itinerary): TripDatesInfo {
    try {
        const startDate = parseAnyDate(itinerary?.startDate);
        const endDate = parseAnyDate(itinerary?.endDate);

        const dayPlans = Array.isArray(itinerary?.itinerary) ? itinerary.itinerary : [];
        let effectiveStart = startDate;
        let effectiveEnd = endDate;

        if (!effectiveStart && dayPlans.length > 0) {
            const first = dayPlans[0]?.date;
            if (first && !first.toLowerCase().startsWith('jour')) {
                effectiveStart = parseAnyDate(first);
            }
        }

        if (!effectiveEnd && dayPlans.length > 0) {
            const last = dayPlans[dayPlans.length - 1]?.date;
            if (last && !last.toLowerCase().startsWith('jour')) {
                effectiveEnd = parseAnyDate(last);
            }
        }

        const totalDays = dayPlans.length || (effectiveStart && effectiveEnd ? Math.max(1, Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1) : 1);
        const now = new Date();
        const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let status: 'upcoming' | 'ongoing' | 'past' | 'flexible' = 'flexible';
        let countdownText = '';
        let dateLabel = '';

        if (effectiveStart && effectiveEnd) {
            if (effectiveStart.getFullYear() === effectiveEnd.getFullYear()) {
                if (effectiveStart.getMonth() === effectiveEnd.getMonth()) {
                    dateLabel = `Du ${safeFormatDate(effectiveStart, 'd')} au ${safeFormatDate(effectiveEnd, 'd MMMM yyyy')}`;
                } else {
                    dateLabel = `Du ${safeFormatDate(effectiveStart, 'd MMM')} au ${safeFormatDate(effectiveEnd, 'd MMM yyyy')}`;
                }
            } else {
                dateLabel = `Du ${safeFormatDate(effectiveStart, 'd MMM yyyy')} au ${safeFormatDate(effectiveEnd, 'd MMM yyyy')}`;
            }

            const startMid = new Date(effectiveStart.getFullYear(), effectiveStart.getMonth(), effectiveStart.getDate());
            const endMid = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), effectiveEnd.getDate());

            if (todayMid < startMid) {
                status = 'upcoming';
                const diffDays = Math.round((startMid.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 0) {
                    countdownText = "Départ aujourd'hui !";
                } else if (diffDays === 1) {
                    countdownText = "Départ demain !";
                } else {
                    countdownText = `Départ dans ${diffDays} j`;
                }
            } else if (todayMid >= startMid && todayMid <= endMid) {
                status = 'ongoing';
                countdownText = "Voyage en cours";
            } else {
                status = 'past';
                countdownText = "Voyage mémorable";
            }
        } else if (effectiveStart) {
            dateLabel = `À partir du ${safeFormatDate(effectiveStart, 'd MMMM yyyy')}`;
        } else if (dayPlans.length > 0 && dayPlans[0]?.date && !dayPlans[0].date.toLowerCase().startsWith('jour')) {
            const first = dayPlans[0].date;
            const last = dayPlans[dayPlans.length - 1]?.date;
            dateLabel = first === last ? first : `Du ${first} au ${last}`;
        } else if (itinerary?.createdAt) {
            const created = parseAnyDate(itinerary.createdAt);
            dateLabel = created ? `Créé le ${safeFormatDate(created, 'd MMM yyyy')}` : "Dates flexibles";
        } else {
            dateLabel = "Dates flexibles";
        }

        return {
            startDate: effectiveStart,
            endDate: effectiveEnd,
            dateLabel: dateLabel || "Dates flexibles",
            totalDays: totalDays || 1,
            status,
            countdownText
        };
    } catch (err) {
        console.error("getTripDatesInfo error:", err);
        return {
            startDate: null,
            endDate: null,
            dateLabel: "Dates flexibles",
            totalDays: 1,
            status: 'flexible',
            countdownText: ''
        };
    }
}


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
            const dayPlans = Array.isArray(itinerary?.itinerary) ? itinerary.itinerary : [];
            const cityNames = dayPlans.map(day => day?.city).filter(Boolean);
            const uniqueCities = [...new Set(cityNames)];

            const coordsCache: { [key: string]: [number, number] } = JSON.parse(localStorage.getItem('coordsCache') || '{}');
            const newCoords: LocationWithCoords[] = [];

            for (const city of uniqueCities) {
                const locationKey = (city || '').toLowerCase();
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
            for (let i = 0; i < dayPlans.length; i++) {
                const day = dayPlans[i];
                if (day?.travelInfo && i + 1 < dayPlans.length) {
                    const nextDay = dayPlans[i + 1];
                    const startCity = newCoords.find(c => c.name === day.city);
                    const endCity = newCoords.find(c => c.name === nextDay?.city);
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

const SendToUserDialog = ({ itinerary, onSent, open, onOpenChange }: { itinerary: Itinerary | null; onSent: () => void; open: boolean; onOpenChange: (open: boolean) => void }) => {
    const [queryStr, setQueryStr] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState<string | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        // Cleanup function to ensure body is never locked if dialog unmounts unexpectedly
        return () => {
            document.body.style.pointerEvents = 'auto';
        };
    }, []);

    const handleSearch = async (val: string) => {
        setQueryStr(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(val)}`);
            const data = await res.json();
            setResults((data.users || []).filter((u: any) => u.uid !== user?.uid));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSendForReal = async (recipient: any) => {
        if (!user || !itinerary?.id) return;
        setSending(recipient.uid);
        try {
            // 1. Create share token if not exists
            let itToken = itinerary.shareToken;
            if (!itToken) {
                itToken = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
                    ? (crypto as any).randomUUID()
                    : Math.random().toString(36).slice(2);
            }

            // Always ensure the public mapping exists so the recipient can import it
            await setDoc(doc(db, 'shared_itineraries', itToken), {
                userId: user.uid,
                itineraryId: itinerary.id,
                sharedAt: new Date().toISOString(),
            }, { merge: true });

            // Always ensure sharing is enabled for this itinerary
            await setDoc(doc(db, 'users', user.uid, 'itineraries', itinerary.id), {
                shareEnabled: true,
                shareToken: itToken,
                sharedAt: new Date().toISOString()
            }, { merge: true });

            // 2. Create internal notification
            const notifRefTarget = doc(collection(db, 'users', recipient.uid, 'notifications'));
            const notifData = {
                id: notifRefTarget.id,
                type: 'itinerary_share',
                senderId: user.uid,
                senderName: user.displayName || 'Un ami',
                itineraryId: itinerary.id,
                itineraryTitle: itinerary.title,
                shareToken: itToken,
                createdAt: new Date().toISOString(),
                read: false
            };
            await setDoc(notifRefTarget, notifData);

            // 3. Trigger Push via Webhook API
            if (recipient.fcmToken) {
                await fetch('/api/notifications/push', {
                    method: 'POST',
                    body: JSON.stringify({
                        fcmToken: recipient.fcmToken,
                        title: 'Nouvel itinéraire partagé !',
                        body: `${user.displayName || 'Un ami'} vous a envoyé l'itinéraire "${itinerary.title}".`,
                        data: { url: `/share/itinerary/${itToken}` }
                    })
                });
            }

            toast({ title: `Itinéraire envoyé à ${recipient.displayName}` });
            onSent();
        } catch (e) {
            toast({ variant: 'destructive', title: 'Échec de l\'envoi' });
        } finally {
            setSending(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Envoyer à un utilisateur</DialogTitle>
                    <div className="text-sm text-muted-foreground italic">
                        Itinéraire : {itinerary?.title}
                    </div>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher par nom ou email..."
                            className="pl-9"
                            value={queryStr}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto space-y-2">
                        {loading && <div className="text-center py-4"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}
                        {!loading && results.map(u => (
                            <div key={u.uid} className="flex items-center justify-between p-2 rounded-md border bg-card">
                                <span>{u.displayName}</span>
                                <Button 
                                    size="sm" 
                                    onClick={() => handleSendForReal(u)}
                                    disabled={sending === u.uid}
                                >
                                    {sending === u.uid ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer"}
                                </Button>
                            </div>
                        ))}
                        {!loading && queryStr.length >= 2 && results.length === 0 && (
                            <div className="text-center text-muted-foreground py-4">Aucun utilisateur trouvé.</div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const ItineraryDisplay = ({ itinerary, onUpdateItinerary, onDeleteActivity }: { itinerary: Itinerary, onUpdateItinerary: (updatedItinerary: Itinerary) => void, onDeleteActivity: (itineraryId: string, dayIndex: number, activityIndex: number) => void }) => {
    const days = useMemo(() => Array.isArray(itinerary?.itinerary) ? itinerary.itinerary : [], [itinerary]);

    const cityColors = useMemo(() => {
        const uniqueCities = [...new Set(days.map(day => day?.city).filter(Boolean))];
        const colors = ["bg-[hsl(var(--chart-1))]", "bg-[hsl(var(--chart-2))]", "bg-[hsl(var(--chart-3))]", "bg-[hsl(var(--chart-4))]", "bg-[hsl(var(--chart-5))]"];
        const cityColorMap: { [city: string]: string } = {};
        
        uniqueCities.forEach((city, index) => {
            if (city) cityColorMap[city] = colors[index % colors.length];
        });
        return cityColorMap;
    }, [days]);

    const handleUpdateDayPlan = (dayIndex: number, updatedDayPlan: DayPlan) => {
        const newDayPlans = [...days];
        newDayPlans[dayIndex] = updatedDayPlan;
        onUpdateItinerary({ ...itinerary, itinerary: newDayPlans });
    };

    const handleUpdateActivity = (dayIndex: number, activityIndex: number | null, activity: Activity) => {
        const newDayPlans = [...days];
        const currentActivities = Array.isArray(newDayPlans[dayIndex]?.activities) ? newDayPlans[dayIndex].activities : [];
        const newActivities = [...currentActivities];

        if (activityIndex !== null) {
            newActivities[activityIndex] = activity;
        } else {
            newActivities.push(activity);
        }

        newDayPlans[dayIndex] = { ...newDayPlans[dayIndex], activities: newActivities };
        onUpdateItinerary({ ...itinerary, itinerary: newDayPlans });
    };

    if (days.length === 0) {
        return (
            <div className="py-6 text-center text-xs text-muted-foreground italic">
                Aucune étape définie pour cet itinéraire.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {days.map((dayPlan, dayIndex) => {
                const activities = Array.isArray(dayPlan?.activities) ? dayPlan.activities : [];
                return (
                    <div key={dayPlan?.day || dayIndex} className="relative pl-8 sm:pl-10">
                        <div className="absolute left-0 h-full w-0.5 bg-border/70"></div>
                        <div className={cn(
                            "absolute -left-2.5 sm:-left-3.5 top-1 font-bold text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm",
                            dayPlan?.city && cityColors[dayPlan.city] ? cityColors[dayPlan.city] : 'bg-primary'
                        )}>
                            {dayPlan?.day || (dayIndex + 1)}
                        </div>
                        <div className="flex justify-between items-start group">
                            <div className="space-y-1">
                                <h4 className="font-semibold text-lg">{dayPlan?.theme || `Jour ${dayIndex + 1}`}</h4>
                                <p className="text-sm text-muted-foreground">{dayPlan?.date || ''} {dayPlan?.city ? `- ${dayPlan.city}` : ''}</p>
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
                            {activities.map((activity, actIndex) => (
                                <Card key={actIndex} className="group relative shadow-sm hover:shadow-md transition-all duration-200 bg-card/85 backdrop-blur-sm border-border/70 hover:bg-card/95">
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
                                        <div className="flex-shrink-0 pt-0.5">{activityIcons[activity?.type] || <Sparkles className="h-5 w-5" />}</div>
                                        <div className="flex-grow space-y-1">
                                            <p className="font-medium text-sm leading-snug">{activity?.description}</p>
                                            {activity?.time && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Clock className="h-3 w-3" /> {activity.time}</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {dayPlan?.travelInfo && (
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
                );
            })}
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


function SavedItinerariesContent() {
    const { user } = useAuth();
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<{[key: string]: boolean}>({});
    const { toast } = useToast();
    const [shareLoading, setShareLoading] = useState<{[key: string]: boolean}>({});
    const [importInput, setImportInput] = useState("");
    const [importLoading, setImportLoading] = useState(false);
    const [itineraryToSend, setItineraryToSend] = useState<Itinerary | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'ongoing' | 'past'>('all');
    const [showImportCard, setShowImportCard] = useState(false);

    const loadItineraries = async () => {
        if (user) {
            setIsLoading(true);
            const savedItineraries = await getItineraries(user.uid);
            setItineraries(savedItineraries);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
          loadItineraries();
        }
    }, [user]);

    const sp = useSearchParams();
    const importToken = sp.get('import');

    useEffect(() => {
        if (importToken && user && !isLoading && !importLoading) {
            setImportInput(importToken);
            const timer = setTimeout(() => {
                handleImportByLink();
                const url = new URL(window.location.href);
                url.searchParams.delete('import');
                window.history.replaceState({}, '', url.toString());
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [importToken, user, isLoading]);

    const handleUpdateItinerary = async (updatedItinerary: Itinerary) => {
        if (!user || !updatedItinerary.id) return;
        setIsUpdating(prev => ({...prev, [updatedItinerary.id as string]: true}));
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
            setItineraries(prev => prev.filter((it: Itinerary) => it.id !== id));
            toast({ title: "Itinéraire supprimé." });
        } catch (error) {
            console.error("Failed to delete itinerary:", error);
            toast({ variant: "destructive", title: "La suppression a échoué." });
        }
    };

    const handleDeleteActivity = (itineraryId: string, dayIndex: number, activityIndex: number) => {
        const itineraryToUpdate = itineraries.find(it => it.id === itineraryId);
        if (!itineraryToUpdate) return;
        
        const newDayPlans = Array.isArray(itineraryToUpdate.itinerary) ? [...itineraryToUpdate.itinerary] : [];
        if (!newDayPlans[dayIndex]) return;
        const currentActivities = Array.isArray(newDayPlans[dayIndex]?.activities) ? newDayPlans[dayIndex].activities : [];
        const newActivities = currentActivities.filter((_, i) => i !== activityIndex);
        newDayPlans[dayIndex] = { ...newDayPlans[dayIndex], activities: newActivities };
        
        handleUpdateItinerary({ ...itineraryToUpdate, itinerary: newDayPlans });
    };

    const handleImportByLink = async () => {
        if (!user) return;
        const raw = importInput.trim();
        if (!raw) return;
        setImportLoading(true);
        try {
            let token = raw;
            if (raw.includes('://') || raw.includes('/share/')) {
                try {
                    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
                    const parts = u.pathname.split('/').filter(Boolean);
                    const tokenIdx = parts.findIndex(p => p === 'itinerary');
                    if (tokenIdx !== -1 && parts[tokenIdx + 1]) {
                        token = parts[tokenIdx + 1];
                    } else {
                        token = parts[parts.length - 1];
                    }
                    const spToken = u.searchParams.get('token');
                    if (spToken) token = spToken;
                } catch (urlErr) {
                    console.error("URL parsing error:", urlErr);
                }
            }

            const mapRef = doc(db, 'shared_itineraries', token);
            const mapSnap = await getDoc(mapRef);
            
            if (!mapSnap.exists()) {
                throw new Error('Lien de partage invalide, expiré ou révoqué.');
            }

            const { userId: ownerId, itineraryId } = mapSnap.data() as { userId: string; itineraryId: string };
            const srcRef = doc(db, 'users', ownerId, 'itineraries', itineraryId);
            const srcSnap = await getDoc(srcRef);
            
            if (!srcSnap.exists()) {
                throw new Error("L'itinéraire source n'existe plus ou n'est plus partagé.");
            }

            const itinerary = srcSnap.data() as Itinerary;
            if (itinerary.shareEnabled === false) {
                 throw new Error("Le partage de cet itinéraire a été désactivé par son propriétaire.");
            }

            const copy: Itinerary = {
                ...itinerary,
                id: undefined,
                userId: user.uid,
                createdAt: new Date().toISOString(),
                shareEnabled: false,
                shareToken: undefined,
                sharedAt: undefined,
            } as any;

            await saveItinerary(user.uid, copy);
            toast({ title: 'Succès !', description: 'Itinéraire importé dans votre compte.' });
            setImportInput("");
            setShowImportCard(false);
            await loadItineraries();
        } catch (e: any) {
            console.error("Import error:", e);
            toast({ 
                variant: 'destructive', 
                title: "Échec de l'import", 
                description: e?.message || "Une erreur est survenue lors de la récupération de l'itinéraire." 
            });
        } finally {
            setImportLoading(false);
        }
    };

    const handleShare = async (itinerary: Itinerary) => {
        if (!user || !itinerary.id) return;
        const itId = itinerary.id;
        setShareLoading(prev => ({...prev, [itId]: true}));
        try {
            const token = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
                ? (crypto as any).randomUUID()
                : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
            const updated = { ...itinerary, shareEnabled: true, shareToken: token, sharedAt: new Date().toISOString() } as Itinerary;
            await saveItinerary(user.uid, updated, itId);
            await setDoc(doc(db, 'shared_itineraries', token), {
                userId: user.uid,
                itineraryId: itId,
                sharedAt: new Date().toISOString(),
            });
            setItineraries(prev => prev.map((it: Itinerary) => it.id === itId ? updated : it));
            const link = `${window.location.origin}/share/itinerary/${token}`;
            await navigator.clipboard.writeText(link).catch(() => {});
            toast({ title: 'Lien de partage généré', description: 'Le lien a été copié dans le presse-papiers.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Échec du partage' });
        } finally {
            setShareLoading(prev => ({...prev, [itId]: false}));
        }
    };

    const handleUnshare = async (itinerary: Itinerary) => {
        if (!user || !itinerary.id) return;
        const itId = itinerary.id;
        setShareLoading(prev => ({...prev, [itId]: true}));
        try {
            const token = itinerary.shareToken;
            const updated = { ...itinerary, shareEnabled: false } as Itinerary;
            delete (updated as any).shareToken;
            delete (updated as any).sharedAt;
            await saveItinerary(user.uid, updated, itId);
            if (token) {
                await deleteDoc(doc(db, 'shared_itineraries', token));
            }
            setItineraries(prev => prev.map((it: Itinerary) => it.id === itId ? updated : it));
            toast({ title: 'Partage révoqué' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Échec de la révocation' });
        } finally {
            setShareLoading(prev => ({...prev, [itId]: false}));
        }
    };

    // Stats calculation for the joyful Travel Dashboard
    const stats = useMemo(() => {
        const countriesSet = new Set<string>();
        const citiesSet = new Set<string>();
        let totalDays = 0;
        let upcomingCount = 0;
        let ongoingCount = 0;
        let pastCount = 0;
        let nextTripCountdown: string | null = null;
        let minDaysToTrip = Infinity;
        const now = new Date();
        const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        itineraries.forEach(it => {
            const assets = getDestinationAssets(
                it.countryCode || 
                it.location || 
                it.citiesToVisit?.[0]?.name || 
                it.itinerary?.[0]?.city || 
                it.title || 
                ''
            );
            if (assets.countryName) countriesSet.add(assets.countryName);

            const days = Array.isArray(it.itinerary) ? it.itinerary : [];
            days.forEach(d => {
                if (d && d.city) citiesSet.add(d.city);
            });

            const dates = getTripDatesInfo(it);
            totalDays += dates.totalDays;

            if (dates.status === 'upcoming') {
                upcomingCount++;
                if (dates.startDate) {
                    const diffDays = Math.round((dates.startDate.getTime() - todayMid.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays < minDaysToTrip) {
                        minDaysToTrip = diffDays;
                        nextTripCountdown = diffDays === 0 ? "Aujourd'hui !" : diffDays === 1 ? "Demain !" : `Dans ${diffDays} j`;
                    }
                }
            } else if (dates.status === 'ongoing') {
                ongoingCount++;
            } else if (dates.status === 'past') {
                pastCount++;
            }
        });

        return {
            destinationsCount: countriesSet.size,
            totalDays,
            citiesCount: citiesSet.size,
            upcomingCount,
            ongoingCount,
            pastCount,
            nextTripCountdown
        };
    }, [itineraries]);

    // Filter itineraries by status and search input
    const filteredItineraries = useMemo(() => {
        return itineraries.filter(it => {
            const dates = getTripDatesInfo(it);
            if (filterStatus !== 'all' && dates.status !== filterStatus) {
                return false;
            }

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const assets = getDestinationAssets(
                    it.countryCode || 
                    it.location || 
                    it.citiesToVisit?.[0]?.name || 
                    it.itinerary?.[0]?.city || 
                    it.title || 
                    ''
                );
                const titleMatch = (it.title || '').toLowerCase().includes(q);
                const countryMatch = assets.countryName.toLowerCase().includes(q);
                const landmarkMatch = (it.landmarkName || assets.landmarkName || '').toLowerCase().includes(q);
                const days = Array.isArray(it.itinerary) ? it.itinerary : [];
                const cityMatch = days.some(d => d && (d.city || '').toLowerCase().includes(q));
                return titleMatch || countryMatch || landmarkMatch || cityMatch;
            }

            return true;
        });
    }, [itineraries, filterStatus, searchQuery]);

    const LoadingSkeleton = () => (
        <div className="space-y-4">
            <Card className="rounded-2xl border-border/70 p-6">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2" />
            </Card>
            <Card className="rounded-2xl border-border/70 p-6">
                <Skeleton className="h-6 w-2/3 mb-3" />
                <Skeleton className="h-4 w-1/2" />
            </Card>
        </div>
    );

    return (
        <div className="container mx-auto max-w-4xl px-3 sm:px-6 py-6 sm:py-10 min-h-screen overflow-x-hidden">
            {/* Hero & Joyful Travel Header */}
            <div className="relative mb-8 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/15 border border-primary/20 p-5 sm:p-8 shadow-sm overflow-hidden">
                {/* Decorative background travel watermark */}
                <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute right-6 bottom-1 text-7xl sm:text-8xl opacity-10 select-none pointer-events-none font-bold">
                    ✈️
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-xs font-semibold text-primary">
                                <Compass className="h-3.5 w-3.5" />
                                <span>Mon Carnet d'Exploration</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
                                Mes Itinéraires
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
                                Retrouvez, personnalisez et revivez chaque étape de vos périples à travers le monde.
                            </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowImportCard(!showImportCard)}
                                className="gap-1.5 shadow-xs border-dashed text-xs sm:text-sm"
                            >
                                <Share2 className="h-4 w-4 text-primary" />
                                <span>Importer</span>
                            </Button>
                            <Button asChild size="sm" className="gap-2 shadow-sm font-medium text-xs sm:text-sm">
                                <Link href="/itineraire">
                                    <Plus className="h-4 w-4" />
                                    <span>Nouveau voyage</span>
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Collapsible Import Box */}
                    {showImportCard && (
                        <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <Card className="border-primary/25 bg-background/90 backdrop-blur-md shadow-xs">
                                <CardContent className="p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                            <Share2 className="h-3.5 w-3.5 text-primary" /> Importer un itinéraire partagé
                                        </span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowImportCard(false)}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Input 
                                            placeholder="Coller un lien de partage ou token (ex: .../share/itinerary/...)" 
                                            value={importInput} 
                                            onChange={(e) => setImportInput(e.target.value)} 
                                            className="text-sm"
                                        />
                                        <Button onClick={handleImportByLink} disabled={!user || importLoading || !importInput.trim()} size="sm">
                                            {importLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Importer'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Travel Stats Dashboard (Joyful, Modern & Friendly) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-2">
                        <div className="p-3 rounded-2xl bg-card/85 backdrop-blur-sm border border-border/80 shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                <Globe className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground font-medium truncate">Destinations</p>
                                <p className="text-lg font-bold text-foreground leading-tight">
                                    {stats.destinationsCount} <span className="text-xs font-normal text-muted-foreground">pays</span>
                                </p>
                            </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-card/85 backdrop-blur-sm border border-border/80 shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground font-medium truncate">Aventure</p>
                                <p className="text-lg font-bold text-foreground leading-tight">
                                    {stats.totalDays} <span className="text-xs font-normal text-muted-foreground">jours</span>
                                </p>
                            </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-card/85 backdrop-blur-sm border border-border/80 shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground font-medium truncate">Villes visitées</p>
                                <p className="text-lg font-bold text-foreground leading-tight">
                                    {stats.citiesCount} <span className="text-xs font-normal text-muted-foreground">villes</span>
                                </p>
                            </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-card/85 backdrop-blur-sm border border-border/80 shadow-xs flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                <Plane className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground font-medium truncate">Prochain vol</p>
                                <p className="text-sm font-bold text-foreground leading-tight truncate">
                                    {stats.nextTripCountdown || (itineraries.length > 0 ? "Prêt à décoller" : "Aucun")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters Toolbar */}
            {itineraries.length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
                    {/* Search bar */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Rechercher une destination, ville, monument..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-8 h-10 bg-card/90 rounded-xl border-border/80 shadow-xs text-sm"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0",
                                filterStatus === 'all'
                                    ? "bg-primary text-primary-foreground shadow-xs"
                                    : "bg-card hover:bg-muted text-muted-foreground border border-border/70"
                            )}
                        >
                            Tous ({itineraries.length})
                        </button>
                        {stats.upcomingCount > 0 && (
                            <button
                                onClick={() => setFilterStatus('upcoming')}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1",
                                    filterStatus === 'upcoming'
                                        ? "bg-emerald-600 text-white shadow-xs"
                                        : "bg-card hover:bg-muted text-muted-foreground border border-border/70"
                                )}
                            >
                                <span>🚀</span> À venir ({stats.upcomingCount})
                            </button>
                        )}
                        {stats.ongoingCount > 0 && (
                            <button
                                onClick={() => setFilterStatus('ongoing')}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1",
                                    filterStatus === 'ongoing'
                                        ? "bg-teal-600 text-white shadow-xs"
                                        : "bg-card hover:bg-muted text-muted-foreground border border-border/70"
                                )}
                            >
                                <span>🌴</span> En cours ({stats.ongoingCount})
                            </button>
                        )}
                        {stats.pastCount > 0 && (
                            <button
                                onClick={() => setFilterStatus('past')}
                                className={cn(
                                    "px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 flex items-center gap-1",
                                    filterStatus === 'past'
                                        ? "bg-purple-600 text-white shadow-xs"
                                        : "bg-card hover:bg-muted text-muted-foreground border border-border/70"
                                )}
                            >
                                <span>✨</span> Souvenirs ({stats.pastCount})
                            </button>
                        )}
                    </div>
                </div>
            )}

            {isLoading ? (
                <LoadingSkeleton />
            ) : itineraries.length === 0 ? (
                <Card className="text-center py-16 rounded-3xl border-dashed border-2 border-border/80 bg-card/60">
                    <CardContent className="space-y-4 max-w-md mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center text-3xl shadow-xs">
                            🎒
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-foreground">Votre carnet de voyage est encore vide</h3>
                            <p className="text-sm text-muted-foreground">
                                Activez le mode voyage et laissez notre intelligence artificielle concevoir votre premier itinéraire de rêve.
                            </p>
                        </div>
                        <div className="pt-2">
                            <Button asChild className="gap-2 shadow-sm">
                                <Link href="/itineraire">
                                    <Sparkles className="h-4 w-4" />
                                    <span>Créer mon premier itinéraire</span>
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : filteredItineraries.length === 0 ? (
                <Card className="text-center py-12 rounded-2xl border-border/70">
                    <CardContent className="space-y-3">
                        <p className="text-muted-foreground text-sm">Aucun itinéraire ne correspond à votre recherche ou filtre.</p>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                        >
                            Réinitialiser les filtres
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {filteredItineraries.map((itinerary, idx) => {
                        const assets = getDestinationAssets(
                            itinerary.countryCode || 
                            itinerary.location || 
                            itinerary.citiesToVisit?.[0]?.name || 
                            itinerary.itinerary?.[0]?.city || 
                            itinerary.title || 
                            ''
                        );
                        const backdropPhoto = itinerary.coverImageUrl || assets.clichePhoto;
                        const landmarkName = itinerary.landmarkName || assets.landmarkName;
                        const countryName = assets.countryName || itinerary.location || "Destination";
                        const flagUrl = itinerary.countryFlagUrl || assets.flagUrl;
                        const datesInfo = getTripDatesInfo(itinerary);

                        const days = Array.isArray(itinerary?.itinerary) ? itinerary.itinerary : [];
                        const uniqueCities = Array.from(new Set(days.map(d => d?.city).filter(Boolean)));

                        return (
                        <AccordionItem 
                            key={itinerary.id || idx} 
                            value={itinerary.id || String(idx)} 
                            className="group relative border border-border/75 bg-card rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden w-full max-w-full"
                        >
                            {/* Cliché landmark photo watermark softly blended on the right side of the card */}
                            <div 
                                className="absolute right-0 top-0 bottom-0 w-2/5 sm:w-1/3 bg-cover bg-center opacity-20 dark:opacity-25 group-hover:opacity-30 transition-all duration-500 pointer-events-none rounded-r-2xl select-none"
                                style={{ 
                                    backgroundImage: `url('${backdropPhoto}')`,
                                    maskImage: 'linear-gradient(to right, transparent 0%, black 80%)',
                                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 80%)'
                                }}
                            />

                           <div className="relative z-10 flex items-start sm:items-center justify-between p-3.5 sm:p-5 w-full max-w-full min-w-0 gap-2 sm:gap-3">
                                <AccordionTrigger className="flex-1 min-w-0 p-0 hover:no-underline text-left">
                                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-1">
                                        {/* High-res Country Flag Badge */}
                                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-7 sm:w-12 sm:h-8 rounded-lg overflow-hidden bg-muted border border-border shadow-xs mt-0.5 sm:mt-0">
                                            <img 
                                                src={flagUrl} 
                                                alt={countryName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                            />
                                        </div>

                                        {/* Text Info */}
                                        <div className="flex flex-col text-left min-w-0 flex-1 space-y-1">
                                            {/* Top badges: Country, Status, Landmark */}
                                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                                <span className="font-bold text-foreground flex items-center gap-1">
                                                    {countryName}
                                                </span>
                                                
                                                {datesInfo.status === 'upcoming' && (
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] border border-emerald-500/20 flex items-center gap-1">
                                                        <span>🚀</span> {datesInfo.countdownText}
                                                    </span>
                                                )}
                                                {datesInfo.status === 'ongoing' && (
                                                    <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 font-semibold text-[11px] border border-teal-500/20 flex items-center gap-1 animate-pulse">
                                                        <span>🌴</span> {datesInfo.countdownText}
                                                    </span>
                                                )}
                                                {datesInfo.status === 'past' && (
                                                    <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 font-medium text-[11px] border border-purple-500/20">
                                                        ✨ Souvenir
                                                    </span>
                                                )}

                                                <span className="text-muted-foreground/60 hidden sm:inline">•</span>
                                                <span className="text-[11px] text-muted-foreground italic hidden sm:inline truncate max-w-[220px]">
                                                    📸 {landmarkName}
                                                </span>
                                            </div>

                                            {/* Itinerary Title (Guaranteed no overflow) */}
                                            <span className="text-base sm:text-lg font-bold leading-snug text-foreground break-words line-clamp-2" title={itinerary.title}>
                                                {itinerary.title}
                                            </span>

                                            {/* Trip Dates (du ... au ...) and Duration */}
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-secondary/80 text-foreground/90 font-medium">
                                                    <Calendar className="h-3 w-3 text-primary" />
                                                    <span>{datesInfo.dateLabel}</span>
                                                </span>
                                                
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground font-normal">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{datesInfo.totalDays} jours</span>
                                                </span>

                                                {itinerary.companionType && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400 text-[11px]">
                                                        <Users className="h-3 w-3" />
                                                        <span>{itinerary.companionName ? `${itinerary.companionType} (${itinerary.companionName})` : itinerary.companionType}</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Visited Cities Route */}
                                            {uniqueCities.length > 0 && (
                                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 overflow-hidden pt-0.5 truncate">
                                                    <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                                                    <span className="truncate">
                                                        {uniqueCities.slice(0, 4).join(' ➔ ')}
                                                        {uniqueCities.length > 4 && ' …'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </AccordionTrigger>

                                {/* Action Buttons outside trigger */}
                                <div className="flex items-center shrink-0 gap-0.5 sm:gap-1 pt-1 sm:pt-0">
                                    <EditTitleDialog itinerary={itinerary} onUpdateItinerary={handleUpdateItinerary}>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                            title="Renommer l'itinéraire"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Edit3 className="h-4 w-4" />
                                        </Button>
                                    </EditTitleDialog>
                                    <ItineraryMapDialog itinerary={itinerary}>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 sm:h-9 sm:w-9 text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors"
                                            title="Voir sur la carte"
                                        >
                                            <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                                        </Button>
                                    </ItineraryMapDialog>
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground"
                                                title="Plus d'actions"
                                            >
                                                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
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
                                            <DropdownMenuItem onSelect={() => { 
                                                setTimeout(() => setItineraryToSend(itinerary), 150); 
                                            }}>
                                                <Send className="mr-2 h-4 w-4" />
                                                <span>Envoyer à un utilisateur</span>
                                            </DropdownMenuItem>
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
                            </div>

                            {/* Accordion Content with High-Res Cliché Panorama Banner & Watermark */}
                            <AccordionContent className="p-3 sm:p-5 pt-0">
                                <div className="relative rounded-2xl overflow-hidden border border-border/75 bg-card/75 backdrop-blur-md p-4 sm:p-6 my-2 shadow-inner">
                                    {/* Transparent cliché photo backdrop with tuned opacity */}
                                    <div 
                                        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none opacity-25 dark:opacity-30 select-none"
                                        style={{ backgroundImage: `url('${backdropPhoto}')` }}
                                    />
                                    <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/90 via-background/70 to-background/90 pointer-events-none" />

                                    <div className="relative z-10 space-y-6">
                                        {/* Panoramic Landmark Preview Banner */}
                                        <div className="relative rounded-2xl overflow-hidden border border-border/80 shadow-md group/banner">
                                            <div 
                                                className="h-32 sm:h-44 w-full bg-cover bg-center relative flex items-end p-4 transition-transform duration-700 group-hover/banner:scale-105 select-none"
                                                style={{ backgroundImage: `url('${backdropPhoto}')` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                                                <div className="relative z-10 flex flex-wrap items-end justify-between w-full gap-2 text-white">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center gap-1.5">
                                                                <span>📸</span> {landmarkName}
                                                            </span>
                                                            <span className="text-xs bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                                                                {countryName}
                                                            </span>
                                                        </div>
                                                        <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight drop-shadow-sm">
                                                            {itinerary.title}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-medium text-white/95 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                                            {datesInfo.dateLabel}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metadata & Status Bar */}
                                        <div className="flex flex-wrap justify-between items-center gap-2 pb-3 border-b border-border/50">
                                            <div className="flex items-center gap-2.5">
                                                <img 
                                                    src={flagUrl} 
                                                    alt={countryName} 
                                                    className="w-6 h-4 object-cover rounded shadow-xs border border-white/20"
                                                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                />
                                                <p className="text-sm font-semibold text-foreground">
                                                    {countryName}
                                                    <span className="text-xs text-muted-foreground font-normal italic ml-2">
                                                        • {landmarkName}
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {(() => {
                                                    const createdDate = parseAnyDate(itinerary.createdAt);
                                                    const formatted = safeFormatDate(createdDate, "d MMM yyyy");
                                                    return formatted ? (
                                                        <p className="text-xs text-muted-foreground">
                                                            Créé le {formatted}
                                                        </p>
                                                    ) : null;
                                                })()}
                                                {isUpdating[itinerary.id!] && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                            </div>
                                        </div>

                                        {/* Day Plans and Activities List */}
                                        <ItineraryDisplay 
                                            itinerary={itinerary} 
                                            onUpdateItinerary={handleUpdateItinerary}
                                            onDeleteActivity={handleDeleteActivity}
                                        />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                    })}
                </Accordion>
            )}
            <SendToUserDialog
                itinerary={itineraryToSend}
                open={!!itineraryToSend}
                onOpenChange={(open) => !open && setItineraryToSend(null)}
                onSent={() => setItineraryToSend(null)}
            />
        </div>
    );
}

export default function SavedItinerariesPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-32 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <SavedItinerariesContent />
        </Suspense>
    );
}
