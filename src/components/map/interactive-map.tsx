
"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LocationWithCoords } from "@/lib/types";
import { capitals } from "@/lib/capitals";

// Custom icons for capitals (red) and other cities (blue)
const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Create a Set of capitals for faster lookups
const capitalsSet = new Set(capitals.map(c => c.toLowerCase()));

interface InteractiveMapProps {
  locations: LocationWithCoords[];
  focusedLocation: [number, number] | null;
}

export default function InteractiveMap({ locations, focusedLocation }: InteractiveMapProps) {
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
      const cityName = location.name.split(',')[0].trim().toLowerCase();
      const isCapital = capitalsSet.has(cityName);

      const marker = L.marker(location.coords, {
          title: location.name,
          icon: isCapital ? redIcon : blueIcon
      });
      marker.bindPopup(`${location.name} (${location.count > 0 ? `${location.count} instant(s)`: ''})`);
      if (markersLayer.current) {
        marker.addTo(markersLayer.current);
      }
    });

    // Adjust map view to fit all markers only if not focusing on a specific one
    if(!focusedLocation) {
        const bounds = new L.LatLngBounds(locations.map(l => l.coords));
        if (bounds.isValid()) {
            leafletMap.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }

  }, [locations, focusedLocation]);


  // Focus on a location when it's selected
  useEffect(() => {
    if (focusedLocation && leafletMap.current) {
        leafletMap.current.flyTo(focusedLocation, 13, {
            animate: true,
            duration: 1.5
        });
    }
  }, [focusedLocation]);


  return (
    <div
      ref={mapRef}
      className="w-full h-[400px] rounded-lg z-0"
    />
  );
}

    
