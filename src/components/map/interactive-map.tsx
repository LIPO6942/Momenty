
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LocationWithCoords } from '@/lib/types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for marker icons being broken in Next.js
// This code needs to run once on the client
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

const MapUpdater = ({ locations }: { locations: LocationWithCoords[] }) => {
    const map = useMap();
    useEffect(() => {
        if (locations.length > 0) {
            const bounds = new L.LatLngBounds(locations.map(l => l.coords));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [locations, map]);
    return null;
}

export default function InteractiveMap({ locations }: InteractiveMapProps) {

  if (locations.length === 0) {
    return (
      <div className="h-[400px] w-full rounded-lg bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Ajoutez des lieux pour les voir sur la carte.</p>
      </div>
    );
  }

  // Use the first location as the initial center, the MapUpdater will adjust the view.
  const center: [number, number] = locations.length > 0 
        ? locations[0].coords 
        : [51.505, -0.09]; // Default to London if no locations

  return (
    <MapContainer
      center={center}
      zoom={locations.length > 1 ? undefined : 5}
      scrollWheelZoom={true}
      style={{ height: '400px', width: '100%' }}
      className="rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location) => (
        <Marker key={location.name} position={location.coords}>
          <Popup>{location.name} ({location.count} instant(s))</Popup>
        </Marker>
      ))}
      <MapUpdater locations={locations} />
    </MapContainer>
  );
}
