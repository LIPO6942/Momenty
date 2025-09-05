

"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, PlusCircle, Trash2, Loader2, Edit, MinusCircle, ChevronsUpDown, Check, Image as ImageIcon } from "lucide-react";
import { useContext, useState, useMemo, useEffect, useRef } from "react";
import { TimelineContext } from "@/context/timeline-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { getManualLocations, saveManualLocations, type ManualLocation } from "@/lib/firestore";
import dynamic from 'next/dynamic';
import type { LocationWithCoords } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { countries } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/context/auth-context";


const InteractiveMap = dynamic(() => import('@/components/map/interactive-map'), {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full rounded-lg" />
});

// Helper to format ISO string to yyyy-MM-dd for date inputs
const toInputDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
        return format(parseISO(isoString), 'yyyy-MM-dd');
    } catch {
        return '';
    }
}

export default function MapPage() {
    const { instants, deleteInstantsByLocation } = useContext(TimelineContext);
    const { user } = useAuth();
    const { toast } = useToast();
    const [manualLocations, setManualLocations] = useState<ManualLocation[]>([]);
    const [locationsWithCoords, setLocationsWithCoords] = useState<LocationWithCoords[]>([]);
    const [isLoadingCoords, setIsLoadingCoords] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [focusedLocation, setFocusedLocation] = useState<[number, number] | null>(null);

    // State for Add Dialog
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [newCountry, setNewCountry] = useState("");
    const [newCities, setNewCities] = useState<string[]>([""]);
    const [newStartDate, setNewStartDate] = useState("");
    const [newEndDate, setNewEndDate] = useState("");
    const [newPhotos, setNewPhotos] = useState<string[]>([]);
    const [newSouvenir, setNewSouvenir] = useState("");
    const [isCountryPopoverOpen, setIsCountryPopoverOpen] = useState(false);
    const addPhotoInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    // State for Edit Dialog
    const [editingLocation, setEditingLocation] = useState<ManualLocation | null>(null);
    const [editedName, setEditedName] = useState("");
    const [editedStartDate, setEditedStartDate] = useState("");
    const [editedEndDate, setEditedEndDate] = useState("");
    const [editedPhotos, setEditedPhotos] = useState<string[]>([]);
    const [editedSouvenir, setEditedSouvenir] = useState("");
    const editPhotoInputRef = useRef<HTMLInputElement>(null);

    const reloadManualLocations = async () => {
        if (!user) return;
        const savedManualLocations = await getManualLocations(user.uid);
        setManualLocations(savedManualLocations);
    };

    useEffect(() => {
        setIsMounted(true);
        if(user) {
            reloadManualLocations();
        }
    }, [user]);

    const instantLocations = useMemo(() => Array.from(new Set(instants.map(i => i.location))), [instants]);

    const allLocations = useMemo(() => {
        const combined = new Map<string, { name: string, startDate?: string, endDate?: string, photos?: string[], souvenir?: string }>();

        manualLocations.forEach(l => combined.set(l.name.toLowerCase(), l));
        instantLocations.forEach(location => {
            if (!combined.has(location.toLowerCase())) {
                combined.set(location.toLowerCase(), { name: location });
            }
        });

        return Array.from(combined.values()).map(location => {
            const isManual = manualLocations.some(ml => ml.name.toLowerCase() === location.name.toLowerCase());
            return {
                ...location,
                count: instants.filter(i => i.location === location.name).length,
                isManual
            }
        }).sort((a, b) => b.count - a.count);
    }, [instantLocations, manualLocations, instants]);

    useEffect(() => {
        const fetchCoordinates = async () => {
            setIsLoadingCoords(true);
            const coordsCache: {[key: string]: [number, number]} = JSON.parse(localStorage.getItem('coordsCache') || '{}');
            const newCoords: LocationWithCoords[] = [];

            for (const location of allLocations) {
                const locationKey = location.name.toLowerCase();
                if (coordsCache[locationKey]) {
                    newCoords.push({ ...location, coords: coordsCache[locationKey] });
                } else {
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location.name)}&format=json&limit=1`);
                        const data = await response.json();
                        if (data && data.length > 0) {
                            const { lat, lon } = data[0];
                            const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];
                            coordsCache[locationKey] = coords;
                            newCoords.push({ ...location, coords });
                        }
                    } catch (error) {
                        console.error(`Failed to geocode ${location.name}:`, error);
                    }
                }
            }
            
            localStorage.setItem('coordsCache', JSON.stringify(coordsCache));
            setLocationsWithCoords(newCoords);
            setIsLoadingCoords(false);
        };

        if (allLocations.length > 0) {
            fetchCoordinates();
        } else {
            setLocationsWithCoords([]);
            setIsLoadingCoords(false);
        }
    }, [allLocations]);

    const locationsByCountry = useMemo(() => {
        const grouped: { [country: string]: LocationWithCoords[] } = {};
        locationsWithCoords.forEach(location => {
            const parts = location.name.split(',').map(p => p.trim());
            const country = parts.length > 1 ? parts[parts.length - 1] : 'Lieux non classés';
            if (!grouped[country]) {
                grouped[country] = [];
            }
            grouped[country].push(location);
        });
        
        const orderedGrouped: { [country: string]: LocationWithCoords[] } = {};
        Object.keys(grouped).sort((a, b) => {
            if (a === 'Lieux non classés') return 1;
            if (b === 'Lieux non classés') return -1;
            return a.localeCompare(b);
        }).forEach(country => {
            orderedGrouped[country] = grouped[country];
        });

        return orderedGrouped;
    }, [locationsWithCoords]);

    const defaultAccordionValues = useMemo(() => Object.keys(locationsByCountry), [locationsByCountry]);


    const handleCityChange = (index: number, value: string) => {
        const updatedCities = [...newCities];
        updatedCities[index] = value;
        setNewCities(updatedCities);
    };

    const handleAddCity = () => {
        setNewCities([...newCities, ""]);
    };

    const handleRemoveCity = (index: number) => {
        if (newCities.length > 1) {
            const updatedCities = newCities.filter((_, i) => i !== index);
            setNewCities(updatedCities);
        }
    };
    

    const handleAddLocations = async () => {
        if (!user) return;
        const country = newCountry.trim();
        if (!country) {
            toast({ variant: "destructive", title: "Veuillez sélectionner un pays." });
            return;
        }

        const citiesToAdd = newCities.map(city => city.trim()).filter(Boolean);
        if (citiesToAdd.length === 0) {
            toast({ variant: "destructive", title: "Veuillez ajouter au moins une ville." });
            return;
        }

        const newManualLocations: ManualLocation[] = [];
        let hasError = false;

        citiesToAdd.forEach(city => {
            const locationName = `${city}, ${country}`;
            if (allLocations.some(l => l.name.toLowerCase() === locationName.toLowerCase())) {
                toast({ variant: "destructive", title: "Erreur", description: `Le lieu "${locationName}" existe déjà.` });
                hasError = true;
            } else {
                const locationToAdd: ManualLocation = {
                    name: locationName,
                    photos: newPhotos,
                };
                if (newStartDate) locationToAdd.startDate = newStartDate;
                if (newEndDate) locationToAdd.endDate = newEndDate;
                if (newSouvenir) locationToAdd.souvenir = newSouvenir;
                
                newManualLocations.push(locationToAdd);
            }
        });

        if (hasError) return;
        
        const currentLocations = await getManualLocations(user.uid);
        const updatedManualLocations = [...currentLocations, ...newManualLocations];
        
        await saveManualLocations(user.uid, updatedManualLocations);
        await reloadManualLocations();

        toast({ title: "Lieu(x) ajouté(s) !" });
        
        setNewCountry("");
        setNewCities([""]);
        setNewStartDate("");
        setNewEndDate("");
        setNewPhotos([]);
        setNewSouvenir("");
        setIsAddDialogOpen(false);
    };


    const openEditDialog = (location: ManualLocation) => {
        setEditingLocation(location);
        setEditedName(location.name);
        setEditedStartDate(toInputDate(location.startDate));
        setEditedEndDate(toInputDate(location.endDate));
        setEditedPhotos(location.photos || []);
        setEditedSouvenir(location.souvenir || "");
    }

    const handleEditLocation = async () => {
        if (!editingLocation || !user) return;
        
        const finalName = editedName.trim();
        if (!finalName) {
            toast({ variant: "destructive", title: "Le nom du lieu ne peut pas être vide." });
            return;
        }

        if (allLocations.some(l => l.name.toLowerCase() === finalName.toLowerCase() && l.name.toLowerCase() !== editingLocation.name.toLowerCase())) {
            toast({ variant: "destructive", title: "Un autre lieu avec ce nom existe déjà." });
            return;
        }

        const currentLocations = await getManualLocations(user.uid);

        const updatedLocations = currentLocations.map(loc => {
            if (loc.name === editingLocation.name) {
                 const updatedLoc: ManualLocation = {
                    name: finalName,
                    photos: editedPhotos,
                 };
                 if(editedStartDate) updatedLoc.startDate = editedStartDate;
                 if(editedEndDate) updatedLoc.endDate = editedEndDate;
                 if(editedSouvenir) updatedLoc.souvenir = editedSouvenir;
                 return updatedLoc;
            }
            return loc;
        });


        await saveManualLocations(user.uid, updatedLocations);
        await reloadManualLocations();
        
        toast({ title: "Lieu mis à jour." });
        setEditingLocation(null);
    }
    
    const handleDeleteLocation = async (locationName: string) => {
        if(!user) return;
        const currentLocations = await getManualLocations(user.uid);
        const updatedManualLocations = currentLocations.filter(l => l.name !== locationName);
        await saveManualLocations(user.uid, updatedManualLocations);
        await reloadManualLocations();
        deleteInstantsByLocation(locationName); // Also delete associated instants
        toast({title: "Lieu et souvenirs associés supprimés."});
    }

    const handlePhotoUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setPhotosCallback: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        const files = e.target.files;
        if (!files) return;
    
        setIsUploading(true);
        toast({ title: `Téléversement de ${files.length} photo(s)...` });
    
        const uploadedUrls = [];
        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                if(!response.ok) throw new Error(`Upload failed for ${file.name}`);
                const result = await response.json();
                uploadedUrls.push(result.secure_url);
            } catch (error) {
                 console.error('Upload Error:', error);
                 toast({ variant: "destructive", title: 'Échec du téléversement', description: `L'envoi de ${file.name} a échoué.` });
            }
        }
    
        setPhotosCallback(prev => [...prev, ...uploadedUrls]);
        setIsUploading(false);
        toast({ title: 'Toutes les photos ont été traitées.' });
    
        if (e.target) {
            e.target.value = '';
        }
    };

    const removeNewPhoto = (index: number) => {
        setNewPhotos(prev => prev.filter((_, i) => i !== index));
    }

    const removeEditedPhoto = (index: number) => {
        setEditedPhotos(prev => prev.filter((_, i) => i !== index));
    };
    

    const formatDateRange = (startDate?: string, endDate?: string) => {
        if (!startDate) return null;
        const start = format(parseISO(startDate), "d MMM yyyy", { locale: fr });
        if (!endDate || startDate === endDate) return `Le ${start}`;
        const end = format(parseISO(endDate), "d MMMM yyyy", { locale: fr });
        return `${start} - ${end}`;
    }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="py-16 space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Ma Carte de Voyage</h1>
        <p className="text-muted-foreground">La liste de tous les lieux que vous avez visités.</p>
      </div>

       <Card className="mb-8 overflow-hidden rounded-xl">
            <CardHeader>
                <CardTitle>Carte du monde</CardTitle>
            </CardHeader>
            <CardContent>
                {isMounted && <InteractiveMap locations={locationsWithCoords} focusedLocation={focusedLocation} />}
                {!isMounted && <Skeleton className="h-[400px] w-full rounded-lg" />}
            </CardContent>
       </Card>

       <div className="mb-8">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button disabled={!user}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Ajouter un lieu
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter un ou plusieurs lieux</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Pays</Label>
                             <Popover open={isCountryPopoverOpen} onOpenChange={setIsCountryPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isCountryPopoverOpen}
                                    className="w-full justify-between"
                                    >
                                    {newCountry
                                        ? countries.find((country) => country.label.toLowerCase() === newCountry.toLowerCase())?.label
                                        : "Sélectionner un pays..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Rechercher un pays..." />
                                        <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                                        <CommandList>
                                            <CommandGroup>
                                                {countries.map((country) => (
                                                <CommandItem
                                                    key={country.value}
                                                    value={country.label}
                                                    onSelect={(currentValue) => {
                                                        setNewCountry(currentValue === newCountry ? "" : currentValue);
                                                        setIsCountryPopoverOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            newCountry.toLowerCase() === country.label.toLowerCase() ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {country.label}
                                                </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Villes</Label>
                            {newCities.map((city, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input
                                        value={city}
                                        onChange={(e) => handleCityChange(index, e.target.value)}
                                        placeholder={`ex: Ville ${index + 1}`}
                                    />
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleRemoveCity(index)}
                                        disabled={newCities.length <= 1}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <MinusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button type="button" variant="outline" size="sm" onClick={handleAddCity} className="mt-2">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Ajouter une autre ville
                            </Button>
                        </div>


                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start-date">Date de début</Label>
                                <Input 
                                    id="start-date" 
                                    type="date"
                                    value={newStartDate}
                                    onChange={(e) => setNewStartDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end-date">Date de fin</Label>
                                <Input 
                                    id="end-date" 
                                    type="date"
                                    value={newEndDate}
                                    onChange={(e) => setNewEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                         <div className="space-y-2">
                            <Label>Photos souvenirs</Label>
                            <div className="flex flex-wrap gap-2">
                                {newPhotos.map((photo, index) => (
                                    <div key={index} className="relative group">
                                        <Image src={photo} alt={`Souvenir ${index + 1}`} width={100} height={100} className="rounded-md object-cover w-24 h-24" />
                                        <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeNewPhoto(index)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" onClick={() => addPhotoInputRef.current?.click()} className="w-full mt-2" disabled={isUploading}>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ImageIcon className="mr-2 h-4 w-4"/>}
                                {isUploading ? "Téléversement..." : "Ajouter des photos"}
                            </Button>
                            <Input type="file" multiple accept="image/*,.heic,.heif" className="hidden" ref={addPhotoInputRef} onChange={(e) => handlePhotoUpload(e, setNewPhotos)}/>
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="souvenir">Un souvenir à raconter ?</Label>
                            <Textarea
                                id="souvenir"
                                value={newSouvenir}
                                onChange={(e) => setNewSouvenir(e.target.value)}
                                placeholder="Écrivez un court souvenir associé à ce lieu..."
                            />
                        </div>

                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost">Annuler</Button>
                        </DialogClose>
                        <Button onClick={handleAddLocations} disabled={isUploading}>Ajouter</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      
       <div className="space-y-4">
        {isLoadingCoords ? (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
        ) : !user ? (
             <div className="text-center py-10">
                <p className="text-muted-foreground">Connectez-vous pour gérer votre carte de voyage.</p>
            </div>
        ) : allLocations.length === 0 ? (
            <div className="text-center py-10">
                <p className="text-muted-foreground">Aucun lieu trouvé. Commencez par ajouter un instant ou un lieu manuellement.</p>
            </div>
        ) : (
            <Accordion type="multiple" defaultValue={defaultAccordionValues} className="w-full space-y-4">
                {Object.entries(locationsByCountry).map(([country, locations]) => (
                    <AccordionItem key={country} value={country} className="border-none bg-card rounded-xl shadow-md shadow-slate-200/80">
                        <AccordionTrigger className="text-xl font-bold text-foreground p-4 hover:no-underline">
                           {country}
                        </AccordionTrigger>
                        <AccordionContent className="p-4 pt-0">
                           <div className="space-y-4 pt-2">
                           {locations.map(location => (
                                <Card key={location.name} className="border shadow-none">
                                    <CardHeader className="flex flex-col items-start gap-4 p-4">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-2 sm:gap-4">
                                            <div className="flex-grow">
                                                <CardTitle className="text-lg font-semibold">{location.name}</CardTitle>
                                                {location.count > 0 && (
                                                   <p className="text-sm text-muted-foreground">{location.count} instant(s) capturé(s)</p>
                                                )}
                                                {location.isManual && location.startDate && (
                                                    <p className="text-xs text-primary pt-1">{formatDateRange(location.startDate, location.endDate)}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0 w-full justify-end sm:w-auto">
                                                <Button variant="outline" size="sm" onClick={() => setFocusedLocation(location.coords)} className="flex-grow sm:flex-grow-0">
                                                        <MapPin className="mr-2 h-4 w-4" />
                                                        Voir
                                                </Button>
                                                {location.isManual && (
                                                    <Dialog onOpenChange={(open) => !open && setEditingLocation(null)}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => openEditDialog(location as ManualLocation)}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Modifier le lieu</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="py-4 space-y-4">
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="edit-location-name">Nom du lieu</Label>
                                                                    <Input 
                                                                        id="edit-location-name" 
                                                                        value={editedName} 
                                                                        onChange={(e) => setEditedName(e.target.value)} 
                                                                    />
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-start-date">Date de début</Label>
                                                                        <Input 
                                                                            id="edit-start-date" 
                                                                            type="date"
                                                                            value={editedStartDate}
                                                                            onChange={(e) => setEditedStartDate(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-end-date">Date de fin</Label>
                                                                        <Input 
                                                                            id="edit-end-date" 
                                                                            type="date"
                                                                            value={editedEndDate}
                                                                            onChange={(e) => setEditedEndDate(e.target.value)}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label>Photos souvenirs</Label>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {editedPhotos.map((photo, index) => (
                                                                            <div key={photo + index} className="relative group">
                                                                                <Image src={photo} alt={`Souvenir ${index + 1}`} width={100} height={100} className="rounded-md object-cover w-24 h-24" />
                                                                                <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeEditedPhoto(index)}>
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <Button type="button" variant="outline" onClick={() => editPhotoInputRef.current?.click()} className="w-full mt-2" disabled={isUploading}>
                                                                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ImageIcon className="mr-2 h-4 w-4"/>}
                                                                        {isUploading ? "Téléversement..." : "Ajouter des photos"}
                                                                    </Button>
                                                                    <Input type="file" multiple accept="image/*,.heic,.heif" className="hidden" ref={editPhotoInputRef} onChange={(e) => handlePhotoUpload(e, setEditedPhotos)} />
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <Label htmlFor="edit-souvenir">Un souvenir à raconter ?</Label>
                                                                    <Textarea
                                                                        id="edit-souvenir"
                                                                        value={editedSouvenir}
                                                                        onChange={(e) => setEditedSouvenir(e.target.value)}
                                                                        placeholder="Écrivez un court souvenir associé à ce lieu..."
                                                                    />
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <DialogClose asChild>
                                                                    <Button variant="ghost">Annuler</Button>
                                                                </DialogClose>
                                                                <Button onClick={handleEditLocation} disabled={isUploading}>Enregistrer</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                                {location.isManual && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="icon" className="h-9 w-9">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                            <AlertDialogTitle>Supprimer ce lieu ?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Cette action est irréversible. Elle supprimera le lieu ainsi que tous les souvenirs (instants) qui y sont associés.
                                                            </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteLocation(location.name)}>
                                                                Supprimer définitivement
                                                            </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {location.souvenir && (
                                            <p className="text-sm text-muted-foreground pt-2 italic">"{location.souvenir}"</p>
                                        )}
                                        
                                        {location.photos && location.photos.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                {location.photos.map((photo, index) => (
                                                   photo && <Image
                                                        key={index}
                                                        src={photo}
                                                        alt={`Miniature du lieu ${index + 1}`}
                                                        width={100}
                                                        height={100}
                                                        className="rounded-md object-cover h-24 w-24"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </CardHeader>
                                </Card>
                            ))}
                           </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        )}
        </div>
    </div>
  );
}
