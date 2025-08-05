
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useContext } from "react";
import { TimelineContext } from "@/context/timeline-context";

// Dummy coordinates for locations
const locationCoordinates: { [key: string]: [number, number] } = {
    "Tozeur, Tunisie": [33.918, 8.134],
    "Chébika, Tunisie": [34.321, 8.021],
    "Campement près de Tozeur": [33.918, 8.134],
    "Tunis, Tunisie": [36.806, 10.181],
    "Paris, France": [48.8566, 2.3522],
};

export default function MapPage() {
    const { instants } = useContext(TimelineContext);

    // Filter unique locations
    const uniqueLocations = Array.from(new Set(instants.map(i => i.location)))
        .map(location => ({
            name: location,
            coords: locationCoordinates[location] || null,
            count: instants.filter(i => i.location === location).length,
        }));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Ma Carte de Voyage</h1>
        <p className="text-muted-foreground">La liste de tous les lieux que vous avez visités.</p>
      </div>
      
       <div className="space-y-4">
        {uniqueLocations.map(location => (
            <Card key={location.name} className="border-none shadow-md shadow-slate-200/80">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-semibold">{location.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{location.count} instant(s) capturé(s)</p>
                    </div>
                    {location.coords && (
                        <Button asChild variant="outline">
                            <a href={`https://www.google.com/maps/search/?api=1&query=${location.coords[0]},${location.coords[1]}`} target="_blank" rel="noopener noreferrer">
                                <MapPin className="mr-2 h-4 w-4" />
                                Voir la carte
                            </a>
                        </Button>
                    )}
                </CardHeader>
            </Card>
        ))}
        </div>
    </div>
  );
}
