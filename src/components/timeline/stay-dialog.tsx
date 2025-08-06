
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
import { useToast } from "@/hooks/use-toast"
import type { Trip as Stay } from '@/lib/types'; // Re-using the Trip type as "Stay"
import { format, parseISO } from 'date-fns';
import { Switch } from '@/components/ui/switch';

interface StayDialogProps {
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
                setStay({});
                setIsStayActive(false);
            }
        }
    }, [open]);

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
            setStay({});
            toast({ title: "Mode séjour terminé." });
            window.dispatchEvent(new Event('storage'));
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStay(prev => ({...prev, [e.target.name]: e.target.value}));
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
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Lieu
              </Label>
              <Input id="location" name="location" value={stay.location || ''} onChange={handleChange} className="col-span-3" placeholder="Ex: Paris" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Début
              </Label>
              <Input id="startDate" name="startDate" type="date" value={toInputDate(stay.startDate)} onChange={handleChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Fin
              </Label>
              <Input id="endDate" name="endDate" type="date" value={toInputDate(stay.endDate)} onChange={handleChange} className="col-span-3" />
            </div>
          </div>
        )}

        <DialogFooter>
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
