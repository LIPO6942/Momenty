
"use client";

import { useState, useMemo, useContext } from "react";
import { TimelineContext } from "@/context/timeline-context";
import type { Instant } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InstantCard } from "@/components/timeline/instant-card";
import { cn } from "@/lib/utils";

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

  const FilterSection = ({ title, items, activeItem, onToggle }: { title: string, items: string[], activeItem: string | null, onToggle: (item: string) => void}) => (
    <div className="space-y-3">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <div className="flex flex-wrap gap-2">
            {items.map(item => (
                <Badge 
                    key={item}
                    variant={activeItem === item ? "default" : "secondary"}
                    onClick={() => onToggle(item)}
                    className="cursor-pointer"
                >
                    {item}
                </Badge>
            ))}
        </div>
    </div>
  )

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 min-h-screen">
      <div className="py-16 space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Explorer mes Souvenirs</h1>
        <p className="text-muted-foreground">Recherchez et filtrez à travers votre journal de voyage.</p>
      </div>

      <div className="space-y-6 mb-8">
        <Input
          placeholder="Rechercher par mot-clé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />

        <div className="grid md:grid-cols-3 gap-6">
            <FilterSection title="Par Catégorie" items={categories} activeItem={activeCategory} onToggle={(item) => toggleFilter(setActiveCategory, item)} />
            <FilterSection title="Par Émotion" items={emotions} activeItem={activeEmotion} onToggle={(item) => toggleFilter(setActiveEmotion, item)} />
            <FilterSection title="Par Lieu" items={locations} activeItem={activeLocation} onToggle={(item) => toggleFilter(setActiveLocation, item)} />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">{filteredInstants.length} Résultat(s)</h2>
        <div className="space-y-6">
          {filteredInstants.length > 0 ? (
            filteredInstants.map(instant => (
                <InstantCard key={instant.id} instant={instant} />
            ))
          ) : (
            <p className="text-muted-foreground text-center py-8">Aucun souvenir ne correspond à votre recherche.</p>
          )}
        </div>
      </div>
    </div>
  );
}
