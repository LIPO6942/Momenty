
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationWithCoords } from "@/lib/types";

// Fix for broken marker icons in Next.js
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
  const markersLayer = useRef<L.LayerGroup | null>(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !leafletMap.current) {
        leafletMap.current = L.map(mapRef.current).setView([46.603354, 1.888334], 5); // Center on France by default

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(leafletMap.current);

        markersLayer.current = L.layerGroup().addTo(leafletMap.current);
    }

    // Cleanup on component unmount
    return () => {
        if (leafletMap.current) {
            leafletMap.current.remove();
            leafletMap.current = null;
        }
    };
  }, []); // Empty dependency array ensures this runs only once


  // Update markers and view when locations change
  useEffect(() => {
    if (!leafletMap.current || !markersLayer.current) return;

    // Clear previous markers
    markersLayer.current.clearLayers();

    if (locations.length === 0) {
        // If no locations, reset to default view
        leafletMap.current.setView([46.603354, 1.888334], 5);
        return;
    }
    
    // Add new markers
    locations.forEach((location) => {
      const marker = L.marker(location.coords, {
          title: location.name
      });
      marker.bindPopup(`${location.name} (${location.count} instant(s))`);
      if (markersLayer.current) {
        marker.addTo(markersLayer.current);
      }
    });

    // Adjust map view to fit all markers
    const bounds = new L.LatLngBounds(locations.map(l => l.coords));
    if (bounds.isValid()) {
        leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

  }, [locations]);


  return (
    <div
      ref={mapRef}
      className="w-full h-[400px] rounded-lg z-0"
    />
  );
}
