"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useContext } from "react";
import { TimelineContext } from "@/context/timeline-context";
import { latLng } from "leaflet";

// Dummy coordinates for locations
const locationCoordinates: { [key: string]: [number, number] } = {
    "Tozeur, Tunisie": [33.918, 8.134],
    "Chébika, Tunisie": [34.321, 8.021],
    "Campement près de Tozeur": [33.918, 8.134],
    "Tunis, Tunisie": [36.806, 10.181],
};

export default function MapView() {
    const { instants } = useContext(TimelineContext);

    // Filter unique locations
    const uniqueLocations = Array.from(new Set(instants.map(i => i.location)))
        .map(location => ({
            name: location,
            coords: locationCoordinates[location] || [31.6295, -7.9811] // Default to Marrakech
        }));

    return (
        <MapContainer center={[31.6295, -7.9811]} zoom={6} style={{ height: '400px', width: '100%' }} className="rounded-lg">
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {uniqueLocations.map(location => (
                location.coords && (
                    <Marker key={location.name} position={latLng(location.coords[0], location.coords[1])}>
                        <Popup>
                           {location.name}
                        </Popup>
                    </Marker>
                )
            ))}
        </MapContainer>
    );
}