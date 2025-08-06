
"use client";

import { useState, useEffect, ReactNode } from 'react';
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast"
import type { Trip } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Switch } from '@/components/ui/switch';

interface TripDialogProps {
    children: ReactNode;
}

const toInputDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
        return format(parseISO(isoString), 'yyyy-MM-dd');
    } catch {
        return '';
    }
}

export function TripDialog({ children }: TripDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const [trip, setTrip] = useState<Partial<Trip>>({});
    const [isTripActive, setIsTripActive] = useState(false);

    useEffect(() => {
        if (open) {
            const savedTrip = localStorage.getItem('activeTrip');
            if (savedTrip) {
                setTrip(JSON.parse(savedTrip));
                setIsTripActive(true);
            } else {
                setTrip({ companionType: 'Solo' });
                setIsTripActive(false);
            }
        }
    }, [open]);

    const handleSave = () => {
        if (!trip.location || !trip.startDate || !trip.endDate) {
            toast({
                variant: "destructive",
                title: "Champs requis",
                description: "Veuillez remplir tous les champs pour le voyage.",
            });
            return;
        }
        const tripToSave: Trip = {
            location: trip.location,
            startDate: new Date(trip.startDate).toISOString(),
            endDate: new Date(trip.endDate).toISOString(),
            companionType: trip.companionType,
            companionName: trip.companionName,
        };
        localStorage.setItem('activeTrip', JSON.stringify(tripToSave));
        toast({ title: "Voyage enregistré !" });
        window.dispatchEvent(new Event('storage')); 
        setOpen(false);
    }
    
    const handleToggleTrip = (isActive: boolean) => {
        setIsTripActive(isActive);
        if (!isActive) {
            localStorage.removeItem('activeTrip');
            setTrip({ companionType: 'Solo' });
            toast({ title: "Mode voyage terminé." });
            window.dispatchEvent(new Event('storage'));
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTrip(prev => ({...prev, [e.target.name]: e.target.value}));
    }

    const handleSelectChange = (value: string) => {
        setTrip(prev => ({...prev, companionType: value as Trip['companionType'], companionName: '' }));
    }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contexte du Voyage</DialogTitle>
          <DialogDescription>
            Activez ce mode pour automatiquement lier vos souvenirs à un voyage.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <Switch id="trip-mode" checked={isTripActive} onCheckedChange={handleToggleTrip} />
          <Label htmlFor="trip-mode">Activer le mode voyage</Label>
        </div>

        {isTripActive && (
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Lieu
              </Label>
              <Input id="location" name="location" value={trip.location || ''} onChange={handleChange} className="col-span-3" placeholder="ex: Russie" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Début
              </Label>
              <Input id="startDate" name="startDate" type="date" value={toInputDate(trip.startDate)} onChange={handleChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Fin
              </Label>
              <Input id="endDate" name="endDate" type="date" value={toInputDate(trip.endDate)} onChange={handleChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="companionType" className="text-right">
                    Avec qui
                </Label>
                <Select value={trip.companionType} onValueChange={handleSelectChange}>
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Solo">Solo</SelectItem>
                        <SelectItem value="Ami(e)">Ami(e)</SelectItem>
                        <SelectItem value="Conjoint(e)">Conjoint(e)</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {trip.companionType && trip.companionType !== 'Solo' && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="companionName" className="text-right">
                        Nom
                    </Label>
                    <Input id="companionName" name="companionName" value={trip.companionName || ''} onChange={handleChange} className="col-span-3" placeholder="Prénom du compagnon"/>
                </div>
            )}
          </div>
        )}

        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="ghost">Fermer</Button>
            </DialogClose>
            {isTripActive && (
              <Button type="button" onClick={handleSave}>Enregistrer</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
