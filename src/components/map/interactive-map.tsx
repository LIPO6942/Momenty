
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationWithCoords } from "@/lib/types";

// Fix pour les icônes de marqueur cassées dans Next.js
// Ce code doit s'exécuter une fois côté client
try {
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
} catch (e) {
    console.error('Could not apply Leaflet icon fix', e);
}


interface InteractiveMapProps {
  locations: LocationWithCoords[];
}

export default function InteractiveMap({ locations }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    // Ne rien faire si le conteneur n'est pas prêt ou s'il n'y a pas de lieux
    if (!mapRef.current || locations.length === 0) return;

    // Si une instance de carte existe déjà, on la met à jour au lieu de la recréer
    if (leafletMap.current) {
        // Mise à jour de la vue pour s'adapter aux nouveaux marqueurs
        const bounds = new L.LatLngBounds(locations.map(l => l.coords));
        if (bounds.isValid()) {
            leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
        }
        
        // Supprimer les anciens marqueurs
        leafletMap.current.eachLayer((layer) => {
            if (layer instanceof L.Marker) {
                layer.remove();
            }
        });

    } else {
        // --- Initialisation de la carte ---
        const center = locations[0].coords;
        leafletMap.current = L.map(mapRef.current).setView(center, 5);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(leafletMap.current);

        const bounds = new L.LatLngBounds(locations.map(l => l.coords));
        if (bounds.isValid()) {
            leafletMap.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    // --- Ajout/Mise à jour des marqueurs ---
    locations.forEach((location) => {
      const marker = L.marker(location.coords, {
          title: location.name
      });
      marker.bindPopup(`${location.name} (${location.count} instant(s))`);
      if(leafletMap.current) {
        marker.addTo(leafletMap.current);
      }
    });


    // --- Fonction de nettoyage ---
    // Cette fonction est cruciale pour le HMR (Hot Module Replacement)
    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [locations]); // Se ré-exécute uniquement si les `locations` changent

  if (locations.length === 0) {
    return (
      <div className="h-[400px] w-full rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Ajoutez des lieux pour les voir sur la carte.</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-[400px] rounded-lg z-0"
    />
  );
}

