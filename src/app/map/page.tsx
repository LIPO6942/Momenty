"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the MapView component to ensure it's client-side only
const MapView = dynamic(() => import('@/components/map/map-view'), { 
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" />
});

export default function MapPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-6">Ma Carte de Voyage</h1>
      <Card>
        <CardContent className="p-2">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <MapView />
            </Suspense>
        </CardContent>
      </Card>
       <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Lieux Visitées</h2>
            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Tozeur, Tunisie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">3 instants capturés.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Tunis, Tunisie</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">2 instants capturés.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}