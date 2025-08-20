
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
import { type Activity } from "@/lib/types";
import { Save } from "lucide-react";

interface EditActivityDialogProps {
  trigger: ReactNode;
  activity?: Activity; // Optional: for editing existing activity
  onSave: (activity: Activity) => void;
}

const activityTypes = ["Musée", "Monument", "Restaurant", "Activité", "Parc", "Shopping", "Soirée", "Autre"];
const defaultActivity: Activity = { time: 'Matin', description: '', type: 'Autre' };

export function EditActivityDialog({ trigger, activity, onSave }: EditActivityDialogProps) {
    const [open, setOpen] = useState(false);
    const [editedActivity, setEditedActivity] = useState<Activity>(activity || defaultActivity);

    useEffect(() => {
        if (open) {
            setEditedActivity(activity || defaultActivity);
        }
    }, [open, activity]);


    const handleSave = () => {
        if (!editedActivity.description) {
            // Optionally add a toast message here for validation
            return;
        }
        onSave(editedActivity);
        setOpen(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{activity ? 'Modifier' : 'Ajouter'} une activité</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input 
                            id="description" 
                            value={editedActivity.description}
                            onChange={(e) => setEditedActivity(prev => ({...prev, description: e.target.value}))}
                            placeholder="ex: Visite de la Tour Eiffel"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="time">Moment</Label>
                            <Input 
                                id="time"
                                value={editedActivity.time} 
                                onChange={(e) => setEditedActivity(prev => ({...prev, time: e.target.value}))}
                                placeholder="ex: Matin, 14h00"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select 
                                value={editedActivity.type}
                                onValueChange={(value) => setEditedActivity(prev => ({...prev, type: value as Activity['type']}))}
                            >
                                <SelectTrigger id="type">
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
