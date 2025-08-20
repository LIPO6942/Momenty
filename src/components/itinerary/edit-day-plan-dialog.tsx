
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import type { DayPlan, TravelInfo } from "@/lib/types";
import { Save } from "lucide-react";
import { Textarea } from "../ui/textarea";

interface EditDayPlanDialogProps {
  children: ReactNode;
  dayPlan: DayPlan;
  onSave: (dayPlan: DayPlan) => void;
}

const transportModes: TravelInfo['mode'][] = ["Train", "Avion", "Voiture", "Bus", "Bateau"];

export function EditDayPlanDialog({ children, dayPlan, onSave }: EditDayPlanDialogProps) {
    const [open, setOpen] = useState(false);
    const [editedDayPlan, setEditedDayPlan] = useState<DayPlan>({ ...dayPlan });

    useEffect(() => {
        if (open) {
            setEditedDayPlan(JSON.parse(JSON.stringify(dayPlan))); // Deep copy
        }
    }, [open, dayPlan]);
    
    const handleSave = () => {
        onSave(editedDayPlan);
        setOpen(false);
    };

    const handleTravelInfoChange = (field: keyof TravelInfo, value: string) => {
        setEditedDayPlan(prev => ({
            ...prev,
            travelInfo: {
                ...prev.travelInfo,
                mode: prev.travelInfo?.mode || 'Voiture',
                description: prev.travelInfo?.description || '',
                [field]: value
            }
        }));
    }

    const toggleTravelInfo = (enabled: boolean) => {
        if(enabled) {
            setEditedDayPlan(prev => ({...prev, travelInfo: {mode: 'Voiture', description: ''}}));
        } else {
            const { travelInfo, ...rest } = editedDayPlan;
            setEditedDayPlan(rest);
        }
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Modifier la journée</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="theme">Thème de la journée</Label>
                        <Input 
                            id="theme" 
                            value={editedDayPlan.theme}
                            onChange={(e) => setEditedDayPlan(prev => ({...prev, theme: e.target.value}))}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input 
                            id="city" 
                            value={editedDayPlan.city}
                            onChange={(e) => setEditedDayPlan(prev => ({...prev, city: e.target.value}))}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input 
                            id="date" 
                            value={editedDayPlan.date}
                            onChange={(e) => setEditedDayPlan(prev => ({...prev, date: e.target.value}))}
                        />
                    </div>
                    <div className="space-y-3 rounded-md border p-3">
                        <Label className="flex items-center">
                            <input type="checkbox" checked={!!editedDayPlan.travelInfo} onChange={(e) => toggleTravelInfo(e.target.checked)} className="mr-2"/>
                            Transport vers la prochaine étape
                        </Label>
                        {editedDayPlan.travelInfo && (
                            <div className="space-y-2 pl-2">
                                <Select value={editedDayPlan.travelInfo.mode} onValueChange={(value) => handleTravelInfoChange('mode', value)}>
                                    <SelectTrigger><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        {transportModes.map(mode => <SelectItem key={mode} value={mode}>{mode}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Textarea 
                                    value={editedDayPlan.travelInfo.description}
                                    onChange={(e) => handleTravelInfoChange('description', e.target.value)}
                                    placeholder="Description du trajet"
                                    className="text-sm"
                                />
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="ghost">Annuler</Button>
                    </DialogClose>
                    <Button onClick={handleSave}>
                       <Save className="mr-2 h-4 w-4" /> Enregistrer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
