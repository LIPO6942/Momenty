
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

// Dummy coordinates for locations
const locationCoordinates: { [key: string]: [number, number] } = {
    "Tozeur, Tunisie": [33.918, 8.134],
    "Chébika, Tunisie": [34.321, 8.021],
    "Campement près de Tozeur": [33.918, 8.134],
    "Tunis, Tunisie": [36.806, 10.181],
    "Paris, France": [48.8566, 2.3522],
};

const MANUAL_LOCATIONS_KEY = 'manualLocations';

interface ManualLocation {
    name: string;
}

export default function MapPage() {
    const { instants } = useContext(TimelineContext);
    const { toast } = useToast();
    const [manualLocations, setManualLocations] = useState<ManualLocation[]>([]);
    const [newLocation, setNewLocation] = useState("");
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
        const combined = new Set([...instantLocations, ...manualLocations.map(l => l.name)]);
        return Array.from(combined).map(location => ({
            name: location,
            coords: locationCoordinates[location] || null,
            count: instants.filter(i => i.location === location).length,
            isManual: !instantLocations.includes(location)
        })).sort((a, b) => b.count - a.count);
    }, [instantLocations, manualLocations, instants]);

    const handleAddLocation = () => {
        if (!newLocation.trim()) {
            toast({ variant: "destructive", title: "Le nom du lieu ne peut pas être vide." });
            return;
        }
        if (allLocations.some(l => l.name.toLowerCase() === newLocation.trim().toLowerCase())) {
            toast({ variant: "destructive", title: "Ce lieu existe déjà." });
            return;
        }

        const newManualLocation = { name: newLocation.trim() };
        const updatedManualLocations = [...manualLocations, newManualLocation];

        setManualLocations(updatedManualLocations);
        localStorage.setItem(MANUAL_LOCATIONS_KEY, JSON.stringify(updatedManualLocations));
        
        toast({ title: "Lieu ajouté !" });
        setNewLocation("");
        setIsDialogOpen(false);
    }
    
    const handleDeleteLocation = (locationName: string) => {
        const updatedManualLocations = manualLocations.filter(l => l.name !== locationName);
        setManualLocations(updatedManualLocations);
        localStorage.setItem(MANUAL_LOCATIONS_KEY, JSON.stringify(updatedManualLocations));
        toast({title: "Lieu supprimé."});
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
                    <div className="py-4 space-y-2">
                        <Label htmlFor="location-name">Nom du lieu (Ville, Pays)</Label>
                        <Input 
                            id="location-name" 
                            value={newLocation} 
                            onChange={(e) => setNewLocation(e.target.value)} 
                            placeholder="ex: Tokyo, Japon"
                        />
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
                    </div>
                    <div className="flex items-center gap-2">
                         {location.coords && (
                            <Button asChild variant="outline" size="sm">
                                <a href={`https://www.google.com/maps/search/?api=1&query=${location.coords[0]},${location.coords[1]}`} target="_blank" rel="noopener noreferrer">
                                    <MapPin className="mr-2 h-4 w-4" />
                                    Voir
                                </a>
                            </Button>
                        )}
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
