"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Itinerary } from "@/lib/types";
import { saveItinerary } from "@/lib/firestore";
import { useAuth } from "@/context/auth-context";

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
      try {
        const res = await fetch(`/api/itineraries/resolve?token=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setItinerary(data.itinerary);
      } catch (e) {
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

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{itinerary.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {itinerary.itinerary.map((d) => (
              <div key={d.day} className="border rounded-md p-3">
                <div className="font-semibold">Jour {d.day}: {d.city} — {d.theme}</div>
                <div className="text-sm text-muted-foreground">{d.date}</div>
                <ul className="list-disc pl-5 mt-2 text-sm">
                  {d.activities.map((a, i) => (
                    <li key={i}>{a.time} — {a.description}</li>
                  ))}
                </ul>
                {d.travelInfo && (
                  <div className="text-xs italic mt-2">{d.travelInfo.mode}: {d.travelInfo.description}</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button onClick={handleSaveToAccount} disabled={!user || saving}>
              {saving ? "Enregistrement…" : user ? "Enregistrer dans mon compte" : "Connectez-vous pour enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
