
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getItineraries, deleteItinerary, type Itinerary } from "@/lib/firestore";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, Calendar, Flag, Loader2, Trash2, Route, Clock, Landmark, Sparkles, Utensils, FerrisWheel, Leaf, ShoppingBag } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

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

    useEffect(() => {
        const loadItineraries = async () => {
            if (user) {
                setIsLoading(true);
                const savedItineraries = await getItineraries(user.uid);
                setItineraries(savedItineraries);
                setIsLoading(false);
            }
        };
        loadItineraries();
    }, [user]);

    const handleDelete = async (id: string) => {
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
                                            <AlertDialogAction onClick={() => handleDelete(itinerary.id!)}>
                                                Confirmer
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                               </div>
                               <div className="space-y-4">
                                    {itinerary.itinerary.map((dayPlan) => (
                                        <div key={dayPlan.day} className="border-t pt-4">
                                             <h4 className="font-semibold text-lg mb-2">Jour {dayPlan.day}: {dayPlan.theme}</h4>
                                             <p className="text-sm text-muted-foreground mb-3">{dayPlan.date} - {dayPlan.city}</p>
                                             <div className="space-y-2">
                                                {dayPlan.activities.map((activity, actIndex) => (
                                                     <div key={actIndex} className="flex items-start gap-3 p-2 rounded-md bg-secondary/50">
                                                        {activityIcons[activity.type] || <Sparkles className="h-4 w-4 text-purple-500" />}
                                                        <div>
                                                            <p className="text-sm font-medium">{activity.description}</p>
                                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3" /> {activity.time}</p>
                                                        </div>
                                                     </div>
                                                ))}
                                             </div>
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
