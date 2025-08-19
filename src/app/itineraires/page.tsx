
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/auth-context";
import { getItineraries, deleteItinerary, saveItinerary, type Itinerary, type DayPlan, type Activity } from "@/lib/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Calendar, Flag, Loader2, Trash2, Route, Clock, Landmark, Sparkles, Utensils, FerrisWheel, Leaf, ShoppingBag, Edit, PlusCircle, MoreVertical } from "lucide-react";
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


const activityIcons: { [key: string]: React.ReactNode } = {
    Musée: <Landmark className="h-5 w-5 text-orange-500" />,
    Monument: <Landmark className="h-5 w-5 text-orange-500" />,
    Restaurant: <Utensils className="h-5 w-5 text-yellow-500" />,
    Activité: <FerrisWheel className="h-5 w-5 text-rose-500" />,
    Parc: <Leaf className="h-5 w-5 text-green-500" />,
    Shopping: <ShoppingBag className="h-5 w-5 text-blue-500" />,
    Autre: <Sparkles className="h-5 w-5 text-purple-500" />,
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
                     <div className="space-y-3 mt-4">
                        {dayPlan.activities.map((activity, actIndex) => (
                             <Card key={actIndex} className="group/activity shadow-sm hover:shadow-md transition-shadow duration-200">
                                <CardContent className="p-3 flex items-start gap-3">
                                    <div className="flex-shrink-0 pt-0.5">{activityIcons[activity.type] || <Sparkles className="h-5 w-5" />}</div>
                                    <div className="flex-grow space-y-1">
                                        <p className="font-medium text-sm leading-snug">{activity.description}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Clock className="h-3 w-3" /> {activity.time}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover/activity:opacity-100 transition-opacity">
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
                                </CardContent>
                             </Card>
                        ))}
                     </div>
                </div>
            ))}
       </div>
    );
};


export default function SavedItinerariesPage() {
    const { user } = useAuth();
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState<{[key: string]: boolean}>({});
    const { toast } = useToast();

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
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
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

    