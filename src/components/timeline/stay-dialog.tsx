
"use client";

import { useState, useEffect, ReactNode, useMemo } from 'react';
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
import type { Trip as Stay } from '@/lib/types'; // Re-using the Trip type as "Stay"
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { Switch } from '@/components/ui/switch';

interface StayDialogProps {
    children: ReactNode;
}

const toInputDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
        const date = parseISO(isoString);
        if (!isValid(date)) return '';
        return format(date, 'yyyy-MM-dd');
    } catch {
        return '';
    }
}

export function StayDialog({ children }: StayDialogProps) {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const [stay, setStay] = useState<Partial<Stay>>({});
    const [isStayActive, setIsStayActive] = useState(false);

    useEffect(() => {
        if (open) {
            const savedStay = localStorage.getItem('activeStay');
            if (savedStay) {
                setStay(JSON.parse(savedStay));
                setIsStayActive(true);
            } else {
                setStay({ location: 'Tunisie', companionType: 'Solo' });
                setIsStayActive(false);
            }
        }
    }, [open]);

    const stayDuration = useMemo(() => {
        if (stay.startDate && stay.endDate) {
            const start = parseISO(stay.startDate);
            const end = parseISO(stay.endDate);
            if (isValid(start) && isValid(end) && end >= start) {
                const nights = differenceInDays(end, start);
                const days = nights + 1;
                return { days, nights };
            }
        }
        return null;
    }, [stay.startDate, stay.endDate]);

    const handleSave = () => {
        if (!stay.location || !stay.startDate || !stay.endDate) {
            toast({
                variant: "destructive",
                title: "Champs requis",
                description: "Veuillez remplir tous les champs pour le séjour.",
            });
            return;
        }
        const stayToSave: Stay = {
            location: stay.location,
            startDate: new Date(stay.startDate).toISOString(),
            endDate: new Date(stay.endDate).toISOString(),
            companionType: stay.companionType,
            companionName: stay.companionName,
        };
        localStorage.setItem('activeStay', JSON.stringify(stayToSave));
        toast({ title: "Séjour enregistré !" });
        window.dispatchEvent(new Event('storage')); 
        setOpen(false);
    }
    
    const handleToggleStay = (isActive: boolean) => {
        setIsStayActive(isActive);
        if (!isActive) {
            localStorage.removeItem('activeStay');
            setStay({ location: 'Tunisie', companionType: 'Solo' });
            toast({ title: "Mode séjour terminé." });
            window.dispatchEvent(new Event('storage'));
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStay(prev => ({...prev, [e.target.name]: e.target.value}));
    }

    const handleSelectChange = (value: string) => {
        setStay(prev => ({...prev, companionType: value as Stay['companionType'], companionName: '' }));
    }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contexte du Séjour</DialogTitle>
          <DialogDescription>
            Activez ce mode pour automatiquement lier vos souvenirs à un séjour.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 py-4">
          <Switch id="stay-mode" checked={isStayActive} onCheckedChange={handleToggleStay} />
          <Label htmlFor="stay-mode">Activer le mode séjour</Label>
        </div>

        {isStayActive && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Lieu</Label>
              <Input id="location" name="location" value={stay.location || ''} onChange={handleChange} placeholder="ex:Djerba" />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div className='space-y-2'>
                    <Label htmlFor="startDate">Début</Label>
                    <Input id="startDate" name="startDate" type="date" value={toInputDate(stay.startDate)} onChange={handleChange} />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor="endDate">Fin</Label>
                    <Input id="endDate" name="endDate" type="date" value={toInputDate(stay.endDate)} onChange={handleChange} />
                </div>
            </div>
            {stayDuration && (
                <p className="text-xs text-center text-muted-foreground -mt-2">
                    Soit {stayDuration.days} jour(s) et {stayDuration.nights} nuitée(s).
                </p>
            )}
            <div className="space-y-2">
                <Label htmlFor="companionType">Avec qui</Label>
                <Select value={stay.companionType} onValueChange={handleSelectChange}>
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
            {stay.companionType && stay.companionType !== 'Solo' && (
                 <div className="space-y-2">
                    <Label htmlFor="companionName">Nom du compagnon</Label>
                    <Input id="companionName" name="companionName" value={stay.companionName || ''} onChange={handleChange} placeholder="Prénom"/>
                </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-4">
            <DialogClose asChild>
                <Button type="button" variant="ghost">Fermer</Button>
            </DialogClose>
            {isStayActive && (
              <Button type="button" onClick={handleSave}>Enregistrer</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
