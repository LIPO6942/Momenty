
"use client";

import { useState, useMemo, useContext } from "react";
import { TimelineContext } from "@/context/timeline-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InstantCard } from "@/components/timeline/instant-card";

export default function ExplorePage() {
  const { instants } = useContext(TimelineContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeEmotion, setActiveEmotion] = useState<string | null>(null);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(instants.map(i => i.category).filter(Boolean))), [instants]) as string[];
  const emotions = useMemo(() => Array.from(new Set(instants.map(i => i.emotion).filter(Boolean))), [instants]);
  const locations = useMemo(() => Array.from(new Set(instants.map(i => i.location))), [instants]);

  const filteredInstants = useMemo(() => {
    return instants.filter((instant) => {
      const searchMatch =
        searchTerm === "" ||
        instant.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instant.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const categoryMatch = !activeCategory || instant.category === activeCategory;
      const emotionMatch = !activeEmotion || instant.emotion === activeEmotion;
      const locationMatch = !activeLocation || instant.location === activeLocation;

      return searchMatch && categoryMatch && emotionMatch && locationMatch;
    });
  }, [instants, searchTerm, activeCategory, activeEmotion, activeLocation]);

  const toggleFilter = (setter: React.Dispatch<React.SetStateAction<string | null>>, value: string) => {
    setter(prev => (prev === value ? null : value));
  }

  const FilterSection = ({ title, items, activeItem, onToggle }: { title: string, items: string[], activeItem: string | null, onToggle: (item: string) => void}) => {
    if (items.length === 0) return null;
    return (
        <div className="space-y-3">
            <h3 className="font-bold text-lg text-foreground">{title}</h3>
            <div className="flex flex-wrap gap-2">
                {items.map(item => (
                    <Button 
                        key={item}
                        variant={activeItem === item ? "default" : "outline"}
                        size="sm"
                        onClick={() => onToggle(item)}
                        className="rounded-full"
                    >
                        {item}
                    </Button>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 min-h-screen">
      <div className="py-16 space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Explorer mes Souvenirs</h1>
        <p className="text-muted-foreground">Recherchez et filtrez à travers votre journal de voyage.</p>
      </div>

      <div className="space-y-6 mb-12">
        <Input
          placeholder="Rechercher par mot-clé dans vos souvenirs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-base py-6 rounded-full px-6"
        />

        <div className="flex flex-col md:flex-row gap-8">
            <FilterSection title="Catégories" items={categories} activeItem={activeCategory} onToggle={(item) => toggleFilter(setActiveCategory, item)} />
            <FilterSection title="Émotions" items={emotions} activeItem={activeEmotion} onToggle={(item) => toggleFilter(setActiveEmotion, item)} />
            <FilterSection title="Lieux" items={locations} activeItem={activeLocation} onToggle={(item) => toggleFilter(setActiveLocation, item)} />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">{filteredInstants.length} Résultat(s)</h2>
        {filteredInstants.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
                {filteredInstants.map(instant => (
                    <InstantCard key={instant.id} instant={instant} />
                ))}
            </div>
        ) : (
            <div className="text-center py-16">
                 <p className="text-muted-foreground">Aucun souvenir ne correspond à votre recherche.</p>
                 <p className="text-sm text-muted-foreground/80 mt-2">Essayez d'ajuster vos filtres.</p>
            </div>
        )}
      </div>
    </div>
  );
}
