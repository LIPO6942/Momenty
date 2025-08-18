
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getItineraries, deleteItinerary, saveItinerary, type Itinerary, type DayPlan, type Activity } from "@/lib/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Calendar, Flag, Loader2, Trash2, Route, Clock, Landmark, Sparkles, Utensils, FerrisWheel, Leaf, ShoppingBag, Edit, PlusCircle } from "lucide-react";
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


const activityIcons: { [key: string]: React.ReactNode } = {
    Musée: <Landmark className="h-4 w-4 text-orange-500" />,
    Monument: <Landmark className="h-4 w-4 text-orange-500" />,
    Restaurant: <Utensils className="h-4 w-4 text-yellow-500" />,
    Activité: <FerrisWheel className="h-4 w-4 text-rose-500" />,
    Parc: <Leaf className="h-4 w-4 text-green-500" />,
    Shopping: <ShoppingBag className="h-4 w-4 text-blue-500" />,
    Autre: <Sparkles className="h-4 w-4 text-purple-500" />,
};


export default function SavedItinerariesPage() {
    const { user } = useAuth();
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
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
        loadItineraries();
    }, [user]);

    const handleUpdateItinerary = async (updatedItinerary: Itinerary) => {
        if (!user) return;
        try {
            await saveItinerary(user.uid, updatedItinerary, updatedItinerary.id);
            setItineraries(prev => prev.map(it => it.id === updatedItinerary.id ? updatedItinerary : it));
            toast({ title: "Itinéraire mis à jour !" });
        } catch (error) {
            console.error("Failed to update itinerary:", error);
            toast({ variant: "destructive", title: "La mise à jour a échoué." });
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

    const handleUpdateDayPlan = (itineraryId: string, dayIndex: number, updatedDayPlan: DayPlan) => {
        const itineraryToUpdate = itineraries.find(it => it.id === itineraryId);
        if (!itineraryToUpdate) return;
        
        const newDayPlans = [...itineraryToUpdate.itinerary];
        newDayPlans[dayIndex] = updatedDayPlan;
        
        handleUpdateItinerary({ ...itineraryToUpdate, itinerary: newDayPlans });
    };

    const handleUpdateActivity = (itineraryId: string, dayIndex: number, activityIndex: number | null, activity: Activity) => {
        const itineraryToUpdate = itineraries.find(it => it.id === itineraryId);
        if (!itineraryToUpdate) return;

        const newDayPlans = [...itineraryToUpdate.itinerary];
        const newActivities = [...newDayPlans[dayIndex].activities];

        if (activityIndex !== null) { // Editing existing activity
            newActivities[activityIndex] = activity;
        } else { // Adding new activity
            newActivities.push(activity);
        }

        newDayPlans[dayIndex] = { ...newDayPlans[dayIndex], activities: newActivities };
        handleUpdateItinerary({ ...itineraryToUpdate, itinerary: newDayPlans });
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
                        <AccordionItem key={itinerary.id || idx} value={itinerary.id || String(idx)} className="border-none bg-card rounded-xl shadow-md shadow-slate-200/80">
                            <AccordionTrigger className="text-xl font-semibold text-left p-4 hover:no-underline">
                                {itinerary.title}
                            </AccordionTrigger>
                            <AccordionContent className="p-4 pt-0">
                               <div className="flex justify-between items-center mb-4">
                                     <p className="text-sm text-muted-foreground">
                                        Créé le {format(parseISO(itinerary.createdAt), "d MMM yyyy", { locale: fr })}
                                    </p>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="destructive" size="sm">
                                                <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Supprimer cet itinéraire ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Cette action est irréversible.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteItinerary(itinerary.id!)}>
                                                Confirmer
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                               </div>
                               <div className="space-y-4">
                                    {itinerary.itinerary.map((dayPlan, dayIndex) => (
                                        <div key={dayPlan.day} className="border-t pt-4">
                                             <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-semibold text-lg">Jour {dayPlan.day}: {dayPlan.theme}</h4>
                                                <EditDayPlanDialog 
                                                    dayPlan={dayPlan} 
                                                    onSave={(updatedDayPlan) => handleUpdateDayPlan(itinerary.id!, dayIndex, updatedDayPlan)}
                                                >
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                                                </EditDayPlanDialog>
                                             </div>

                                             <p className="text-sm text-muted-foreground mb-3">{dayPlan.date} - {dayPlan.city}</p>
                                             <div className="space-y-2">
                                                {dayPlan.activities.map((activity, actIndex) => (
                                                     <div key={actIndex} className="flex items-start gap-3 p-2 rounded-md bg-secondary/50">
                                                        {activityIcons[activity.type] || <Sparkles className="h-4 w-4 text-purple-500" />}
                                                        <div className="flex-grow">
                                                            <p className="text-sm font-medium">{activity.description}</p>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" /> {activity.time}</p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <EditActivityDialog
                                                                activity={activity}
                                                                onSave={(updatedActivity) => handleUpdateActivity(itinerary.id!, dayIndex, actIndex, updatedActivity)}
                                                                trigger={<Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3 w-3"/></Button>}
                                                                />
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteActivity(itinerary.id!, dayIndex, actIndex)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                     </div>
                                                ))}
                                             </div>
                                             <EditActivityDialog
                                                onSave={(newActivity) => handleUpdateActivity(itinerary.id!, dayIndex, null, newActivity)}
                                                trigger={
                                                    <Button variant="outline" size="sm" className="mt-3 w-full">
                                                        <PlusCircle className="mr-2 h-4 w-4" /> Ajouter une activité
                                                    </Button>
                                                }
                                                />
                                        </div>
                                    ))}
                               </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
}
