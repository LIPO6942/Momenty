"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import type { LocationWithCoords } from '@/lib/types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for marker icons
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

interface InteractiveMapProps {
  locations: LocationWithCoords[];
}

export default function InteractiveMap({ locations }: InteractiveMapProps) {
  useEffect(() => {
    const existingMap = document.querySelector('.leaflet-container');
    if (existingMap && (existingMap as any)._leaflet_id) {
      (existingMap as HTMLElement).remove();
    }
  }, []);

  if (locations.length === 0) {
    return (
      <div className="h-[400px] w-full rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Ajoutez des lieux pour les voir sur la carte.</p>
      </div>
    );
  }

  const center: [number, number] = locations.length > 0 
        ? locations[0].coords 
        : [51.505, -0.09]; // Default to London if no locations

  return (
    <MapContainer
      id="custom-map"
      center={center}
      zoom={2}
      scrollWheelZoom={true}
      style={{ height: '400px', width: '100%' }}
      className="rounded-lg z-0 leaflet-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location) => (
        <Marker key={location.name} position={location.coords}>
          <Popup>{location.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
