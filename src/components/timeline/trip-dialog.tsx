
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
import type { Trip, CityWithDays } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, MinusCircle } from 'lucide-react';

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
    const [cities, setCities] = useState<CityWithDays[]>([{name: '', days: 1}]);

    useEffect(() => {
        if (open) {
            const savedTrip = localStorage.getItem('activeTrip');
            if (savedTrip) {
                const parsedTrip = JSON.parse(savedTrip);
                setTrip(parsedTrip);
                setCities(parsedTrip.citiesToVisit && parsedTrip.citiesToVisit.length > 0 ? parsedTrip.citiesToVisit : [{name: '', days: 1}]);
                setIsTripActive(true);
            } else {
                setTrip({ companionType: 'Solo' });
                setCities([{name: '', days: 1}]);
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
            citiesToVisit: cities.filter(c => c.name.trim() !== '' && c.days > 0),
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
            setCities([{name: '', days: 1}]);
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

    const handleCityChange = (index: number, field: 'name' | 'days', value: string) => {
        const updatedCities = [...cities];
        if (field === 'days') {
            updatedCities[index][field] = Number(value);
        } else {
            updatedCities[index][field] = value;
        }
        setCities(updatedCities);
    };
    
    const handleAddCity = () => {
        setCities([...cities, {name: '', days: 1}]);
    };

    const handleRemoveCity = (index: number) => {
        if (cities.length > 1) {
            const updatedCities = cities.filter((_, i) => i !== index);
            setCities(updatedCities);
        } else {
            // If it's the last one, just clear it
            setCities([{name: '', days: 1}]);
        }
    };


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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Pays</Label>
              <Input id="location" name="location" value={trip.location || ''} onChange={handleChange} placeholder="ex: France" />
            </div>

            <div className="space-y-2">
                <Label>Villes à visiter (facultatif)</Label>
                {cities.map((city, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            value={city.name}
                            onChange={(e) => handleCityChange(index, 'name', e.target.value)}
                            placeholder={`Ville ${index + 1}`}
                            className="flex-grow"
                        />
                        <Input
                            type="number"
                            value={city.days}
                            onChange={(e) => handleCityChange(index, 'days', e.target.value)}
                            min="1"
                            className="w-20"
                            aria-label="Nombre de jours"
                        />
                         <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveCity(index)}
                            className="text-destructive hover:text-destructive"
                        >
                            <MinusCircle className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddCity}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter une ville
                </Button>
            </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startDate">Début</Label>
                    <Input id="startDate" name="startDate" type="date" value={toInputDate(trip.startDate)} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="endDate">Fin</Label>
                    <Input id="endDate" name="endDate" type="date" value={toInputDate(trip.endDate)} onChange={handleChange} />
                </div>
             </div>
             <div className="space-y-2">
                <Label htmlFor="companionType">Avec qui</Label>
                <Select value={trip.companionType} onValueChange={handleSelectChange}>
                    <SelectTrigger>
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
                 <div className="space-y-2">
                    <Label htmlFor="companionName">Nom du compagnon</Label>
                    <Input id="companionName" name="companionName" value={trip.companionName || ''} onChange={handleChange} placeholder="Prénom"/>
                </div>
            )}
          </div>
        )}

        <DialogFooter className='pt-4'>
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
