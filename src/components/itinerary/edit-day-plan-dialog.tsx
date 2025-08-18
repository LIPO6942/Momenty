
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
import { type DayPlan } from "@/lib/types";
import { Save } from "lucide-react";

interface EditDayPlanDialogProps {
  children: ReactNode;
  dayPlan: DayPlan;
  onSave: (dayPlan: DayPlan) => void;
}

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
