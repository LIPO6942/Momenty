import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const suggestions = {
    Nature: [
        { name: "Jardin Majorelle", description: "Un jardin botanique luxuriant avec des couleurs vibrantes." },
        { name: "Cascades d'Ouzoud", description: "Des chutes d'eau impressionnantes au cœur des montagnes." },
    ],
    Culture: [
        { name: "Médina de Fès", description: "L'une des plus anciennes et des plus grandes villes médiévales du monde." },
        { name: "Koutoubia", description: "Le minaret emblématique de Marrakech." },
    ],
    Gastronomie: [
        { name: "Jemaa el-Fna", description: "Une place célèbre pour ses stands de nourriture de rue." },
        { name: "Restaurant La Sqala", description: "Cuisine marocaine traditionnelle dans un cadre historique." },
    ],
    Caché: [
        { name: "Le Jardin Secret", description: "Un riad paisible et caché au cœur de la médina." },
        { name: "Tanneries de Chouara", description: "Découvrez le processus de teinture du cuir traditionnel." },
    ]
}

export default function ExplorePage() {
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
       <div className="py-16 space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Explorer Autour de Moi</h1>
        <p className="text-muted-foreground">Suggestions basées sur votre position actuelle à Marrakech.</p>
      </div>

      <div className="space-y-8">
        {Object.entries(suggestions).map(([category, places]) => (
            <div key={category}>
                <h2 className="text-2xl font-bold mb-4">{category}</h2>
                <div className="grid gap-6 md:grid-cols-2">
                    {places.map((place) => (
                        <Card key={place.name} className="border-none shadow-md shadow-slate-200/80">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">{place.name}</CardTitle>
                                <CardDescription>{place.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Ajouter à ma liste
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
