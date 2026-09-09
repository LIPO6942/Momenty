"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Itinerary } from "@/lib/types";
import { saveItinerary } from "@/lib/firestore";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

import { getDestinationAssets } from "@/lib/destination-assets";

export default function SharedItineraryPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) return;
      try {
        setLoading(true);
        // Step 1: Resolve token to mapping
        const mapRef = doc(db, 'shared_itineraries', token);
        const mapSnap = await getDoc(mapRef);
        
        if (!mapSnap.exists()) {
          // Fallback to API if mapping doesn't exist (maybe legacy or index-based)
          const res = await fetch(`/api/itineraries/resolve?token=${encodeURIComponent(token)}`);
          if (!res.ok) throw new Error("Not found");
          const data = await res.json();
          setItinerary(data.itinerary);
          return;
        }

        const { userId: ownerId, itineraryId } = mapSnap.data() as { userId: string; itineraryId: string };
        
        // Step 2: Fetch itinerary from owner's subcollection
        const srcRef = doc(db, 'users', ownerId, 'itineraries', itineraryId);
        const srcSnap = await getDoc(srcRef);
        
        if (!srcSnap.exists()) throw new Error("Source not found");
        
        const data = srcSnap.data() as Itinerary;
        if (!data.shareEnabled) throw new Error("Sharing disabled");
        
        setItinerary({ ...data, id: srcSnap.id });
      } catch (e) {
        console.error("Resolve error:", e);
        setItinerary(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [token]);

  const handleSaveToAccount = async () => {
    if (!user || !itinerary) return;
    setSaving(true);
    try {
      const copy: Itinerary = {
        ...itinerary,
        id: undefined,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        shareEnabled: false,
        shareToken: undefined,
        sharedAt: undefined,
      } as any;
      await saveItinerary(user.uid, copy);
      toast({ title: "Itinéraire copié dans votre compte." });
    } catch (e) {
      toast({ variant: "destructive", title: "Échec de la copie." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container mx-auto max-w-2xl px-4 py-8">Chargement…</div>;
  if (!itinerary) return <div className="container mx-auto max-w-2xl px-4 py-8">Itinéraire introuvable ou lien révoqué.</div>;

  const assets = getDestinationAssets(itinerary.location || itinerary.itinerary?.[0]?.city || '');

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <div className="relative rounded-3xl overflow-hidden border border-border/80 shadow-2xl bg-card/75 backdrop-blur-md p-6 sm:p-8">
        {/* Transparent cliché photo backdrop */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none opacity-15 dark:opacity-20 scale-105 transition-all select-none"
          style={{ backgroundImage: `url('${itinerary.coverImageUrl || assets.clichePhoto}')` }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/90 via-background/75 to-background/95 pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="text-center space-y-3 pb-6 border-b border-border/40">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-xs text-xs">
              <img 
                src={itinerary.countryFlagUrl || assets.flagUrl} 
                alt={assets.countryName} 
                className="w-5 h-3.5 object-cover rounded shadow-xs" 
              />
              <span className="font-semibold">{assets.countryName}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground italic">{itinerary.landmarkName || assets.landmarkName}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{itinerary.title}</h1>
          </div>

          <div className="space-y-4">
            {itinerary.itinerary.map((d) => (
              <div key={d.day} className="rounded-xl border border-border/70 bg-card/85 backdrop-blur-sm p-4 shadow-xs">
                <div className="font-semibold text-foreground">Jour {d.day}: {d.city} — {d.theme}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{d.date}</div>
                <ul className="list-disc pl-5 mt-3 text-sm space-y-1 text-foreground/90">
                  {d.activities.map((a, i) => (
                    <li key={i}>{a.time} — {a.description}</li>
                  ))}
                </ul>
                {d.travelInfo && (
                  <div className="text-xs italic mt-2.5 text-muted-foreground bg-secondary/50 p-2 rounded">
                    {d.travelInfo.mode}: {d.travelInfo.description}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 text-center">
            <Button onClick={handleSaveToAccount} disabled={!user || saving} className="w-full sm:w-auto">
              {saving ? "Enregistrement…" : user ? "Enregistrer dans mon compte" : "Connectez-vous pour enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
