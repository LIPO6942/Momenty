
"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, PlusCircle, Trash2 } from "lucide-react";
import { useContext, useState, useMemo, useEffect } from "react";
import { TimelineContext } from "@/context/timeline-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

const MANUAL_LOCATIONS_KEY = 'manualLocations';

interface ManualLocation {
    name: string;
    startDate?: string;
    endDate?: string;
}

export default function MapPage() {
    const { instants } = useContext(TimelineContext);
    const { toast } = useToast();
    const [manualLocations, setManualLocations] = useState<ManualLocation[]>([]);
    const [newLocationName, setNewLocationName] = useState("");
    const [newStartDate, setNewStartDate] = useState("");
    const [newEndDate, setNewEndDate] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        try {
            const savedManualLocations = localStorage.getItem(MANUAL_LOCATIONS_KEY);
            if (savedManualLocations) {
                setManualLocations(JSON.parse(savedManualLocations));
            }
        } catch (error) {
            console.error("Failed to load manual locations from localStorage", error);
        }
    }, []);

    const instantLocations = useMemo(() => Array.from(new Set(instants.map(i => i.location))), [instants]);

    const allLocations = useMemo(() => {
        const combined = new Map<string, { name: string, startDate?: string, endDate?: string }>();

        // Add manual locations first
        manualLocations.forEach(l => combined.set(l.name.toLowerCase(), l));

        // Add instant locations, avoiding duplicates
        instantLocations.forEach(location => {
            if (!combined.has(location.toLowerCase())) {
                combined.set(location.toLowerCase(), { name: location });
            }
        });

        return Array.from(combined.values()).map(location => {
            const isManual = manualLocations.some(ml => ml.name.toLowerCase() === location.name.toLowerCase());
            return {
                ...location,
                count: instants.filter(i => i.location === location.name).length,
                isManual
            }
        }).sort((a, b) => b.count - a.count);
    }, [instantLocations, manualLocations, instants]);

    const handleAddLocation = () => {
        if (!newLocationName.trim()) {
            toast({ variant: "destructive", title: "Le nom du lieu ne peut pas être vide." });
            return;
        }
        if (allLocations.some(l => l.name.toLowerCase() === newLocationName.trim().toLowerCase())) {
            toast({ variant: "destructive", title: "Ce lieu existe déjà." });
            return;
        }

        const newManualLocation: ManualLocation = { 
            name: newLocationName.trim(),
            startDate: newStartDate || undefined,
            endDate: newEndDate || undefined,
        };
        const updatedManualLocations = [...manualLocations, newManualLocation];

        setManualLocations(updatedManualLocations);
        localStorage.setItem(MANUAL_LOCATIONS_KEY, JSON.stringify(updatedManualLocations));
        
        toast({ title: "Lieu ajouté !" });
        setNewLocationName("");
        setNewStartDate("");
        setNewEndDate("");
        setIsDialogOpen(false);
    }
    
    const handleDeleteLocation = (locationName: string) => {
        const updatedManualLocations = manualLocations.filter(l => l.name !== locationName);
        setManualLocations(updatedManualLocations);
        localStorage.setItem(MANUAL_LOCATIONS_KEY, JSON.stringify(updatedManualLocations));
        toast({title: "Lieu supprimé."});
    }

    const formatDateRange = (startDate?: string, endDate?: string) => {
        if (!startDate) return null;
        const start = format(parseISO(startDate), "d MMM yyyy", { locale: fr });
        if (!endDate) return `Depuis le ${start}`;
        const end = format(parseISO(endDate), "d MMM yyyy", { locale: fr });
        return `${start} - ${end}`;
    }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="py-16 space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Ma Carte de Voyage</h1>
        <p className="text-muted-foreground">La liste de tous les lieux que vous avez visités.</p>
      </div>

       <div className="mb-8">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ajouter un lieu
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter un nouveau lieu</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="location-name">Nom du lieu (Ville, Pays)</Label>
                            <Input 
                                id="location-name" 
                                value={newLocationName} 
                                onChange={(e) => setNewLocationName(e.target.value)} 
                                placeholder="ex: Tokyo, Japon"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-date">Date de début</Label>
                                <Input 
                                    id="start-date" 
                                    type="date"
                                    value={newStartDate}
                                    onChange={(e) => setNewStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date">Date de fin</Label>
                                <Input 
                                    id="end-date" 
                                    type="date"
                                    value={newEndDate}
                                    onChange={(e) => setNewEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost">Annuler</Button>
                        </DialogClose>
                        <Button onClick={handleAddLocation}>Ajouter</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      
       <div className="space-y-4">
        {allLocations.map(location => (
            <Card key={location.name} className="border-none shadow-md shadow-slate-200/80">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold">{location.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{location.count} instant(s) capturé(s)</p>
                        {location.isManual && location.startDate && (
                             <p className="text-xs text-primary pt-1">{formatDateRange(location.startDate, location.endDate)}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name)}`} target="_blank" rel="noopener noreferrer">
                                <MapPin className="mr-2 h-4 w-4" />
                                Voir
                            </a>
                        </Button>
                        {location.isManual && (
                             <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteLocation(location.name)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardHeader>
            </Card>
        ))}
        </div>
    </div>
  );
}
