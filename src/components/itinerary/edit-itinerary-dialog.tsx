
"use client";

import { useState, ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Itinerary, type DayPlan, type Activity } from "@/lib/types";
import { Loader2, Plus, Trash2, Edit, Save } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { saveItinerary } from "@/lib/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface EditItineraryDialogProps {
  children: ReactNode;
  itinerary: Itinerary;
  onItineraryUpdated: (itinerary: Itinerary) => void;
}

const activityTypes = ["Musée", "Monument", "Restaurant", "Activité", "Parc", "Shopping", "Autre"];

export function EditItineraryDialog({ children, itinerary, onItineraryUpdated }: EditItineraryDialogProps) {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editedItinerary, setEditedItinerary] = useState<Itinerary>({ ...itinerary });
    
    useEffect(() => {
        if (open) {
            setEditedItinerary(JSON.parse(JSON.stringify(itinerary))); // Deep copy
        }
    }, [open, itinerary]);

    const handleFieldChange = <T, K extends keyof T>(
        index: number,
        field: K,
        value: T[K],
        list: T[],
        setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
        const newList = [...list];
        newList[index] = { ...newList[index], [field]: value };
        setter(newList);
    };

    const handleActivityChange = (dayIndex: number, activityIndex: number, field: keyof Activity, value: string) => {
        const newDayPlans = [...editedItinerary.itinerary];
        const newActivities = [...newDayPlans[dayIndex].activities];
        newActivities[activityIndex] = {...newActivities[activityIndex], [field]: value};
        newDayPlans[dayIndex] = {...newDayPlans[dayIndex], activities: newActivities};
        setEditedItinerary(prev => ({...prev, itinerary: newDayPlans}));
    }
    
    const handleDayPlanChange = (dayIndex: number, field: keyof DayPlan, value: string) => {
        const newDayPlans = [...editedItinerary.itinerary];
        newDayPlans[dayIndex] = {...newDayPlans[dayIndex], [field]: value};
        setEditedItinerary(prev => ({...prev, itinerary: newDayPlans}));
    }

    const addActivity = (dayIndex: number) => {
        const newDayPlans = [...editedItinerary.itinerary];
        newDayPlans[dayIndex].activities.push({ time: 'Matin', description: 'Nouvelle activité', type: 'Autre' });
        setEditedItinerary(prev => ({...prev, itinerary: newDayPlans}));
    };
    
    const removeActivity = (dayIndex: number, activityIndex: number) => {
        const newDayPlans = [...editedItinerary.itinerary];
        newDayPlans[dayIndex].activities.splice(activityIndex, 1);
        setEditedItinerary(prev => ({...prev, itinerary: newDayPlans}));
    };
    
    const addDay = () => {
        const newDayPlans = [...editedItinerary.itinerary];
        const lastDay = newDayPlans[newDayPlans.length - 1];
        newDayPlans.push({
            day: newDayPlans.length + 1,
            date: 'Nouvelle date',
            city: lastDay ? lastDay.city : 'Nouvelle ville',
            theme: 'Nouvelle journée',
            activities: [],
        });
        setEditedItinerary(prev => ({...prev, itinerary: newDayPlans}));
    }

    const removeDay = (dayIndex: number) => {
        const newDayPlans = [...editedItinerary.itinerary]
            .filter((_, i) => i !== dayIndex)
            .map((day, i) => ({...day, day: i + 1})); // Re-number days
        setEditedItinerary(prev => ({...prev, itinerary: newDayPlans}));
    }

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            await saveItinerary(user.uid, editedItinerary, editedItinerary.id);
            onItineraryUpdated(editedItinerary);
            setOpen(false);
        } catch (error) {
            console.error("Failed to save itinerary:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Modifier l'itinéraire</DialogTitle>
                </DialogHeader>
                <div className="flex-grow overflow-hidden pr-2">
                 <ScrollArea className="h-full pr-4">
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                           <Label htmlFor="itineraryTitle">Titre de l'itinéraire</Label>
                           <Input 
                                id="itineraryTitle" 
                                value={editedItinerary.title}
                                onChange={(e) => setEditedItinerary(prev => ({...prev, title: e.target.value}))}
                            />
                        </div>
                         <Accordion type="multiple" defaultValue={editedItinerary.itinerary.map(d => String(d.day))} className="w-full space-y-2">
                           {editedItinerary.itinerary.map((dayPlan, dayIndex) => (
                               <AccordionItem key={dayIndex} value={String(dayPlan.day)} className="border rounded-md">
                                    <div className="flex items-center pr-2">
                                        <AccordionTrigger className="flex-1 px-4">
                                            <span>Jour {dayPlan.day}: {dayPlan.theme}</span>
                                        </AccordionTrigger>
                                        <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0" onClick={() => removeDay(dayIndex)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <AccordionContent className="space-y-4 pt-2 px-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input value={dayPlan.theme} onChange={(e) => handleDayPlanChange(dayIndex, 'theme', e.target.value)} placeholder="Thème"/>
                                            <Input value={dayPlan.city} onChange={(e) => handleDayPlanChange(dayIndex, 'city', e.target.value)} placeholder="Ville"/>
                                        </div>
                                        <Input value={dayPlan.date} onChange={(e) => handleDayPlanChange(dayIndex, 'date', e.target.value)} placeholder="Date"/>

                                        <Separator />

                                        {dayPlan.activities.map((activity, activityIndex) => (
                                            <div key={activityIndex} className="space-y-2 p-3 bg-secondary/50 rounded-md">
                                                <div className="flex justify-between items-center">
                                                    <Label>Activité {activityIndex + 1}</Label>
                                                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeActivity(dayIndex, activityIndex)}>
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                                <Input 
                                                    value={activity.description} 
                                                    onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'description', e.target.value)}
                                                    placeholder="Description"
                                                />
                                                <div className="flex gap-2">
                                                    <Input 
                                                        value={activity.time} 
                                                        onChange={(e) => handleActivityChange(dayIndex, activityIndex, 'time', e.target.value)}
                                                        placeholder="Moment (ex: Matin)"
                                                    />
                                                     <Select 
                                                        value={activity.type}
                                                        onValueChange={(value) => handleActivityChange(dayIndex, activityIndex, 'type', value)}
                                                      >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {activityTypes.map(type => (
                                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        ))}

                                        <Button type="button" variant="outline" size="sm" onClick={() => addActivity(dayIndex)}>
                                            <Plus className="mr-2 h-4 w-4"/> Ajouter une activité
                                        </Button>

                                    </AccordionContent>
                               </AccordionItem>
                           ))}
                        </Accordion>
                        <Button type="button" variant="secondary" onClick={addDay} className="w-full mt-4">
                           <Plus className="mr-2 h-4 w-4"/> Ajouter un jour
                        </Button>
                    </div>
                 </ScrollArea>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Annuler</Button>
                    </DialogClose>
                    <Button onClick={handleSaveChanges} disabled={isLoading}>
                       {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                       <Save className="mr-2 h-4 w-4" /> Enregistrer les modifications
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
