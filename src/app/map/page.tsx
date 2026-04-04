"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, PlusCircle, Trash2, Loader2, Edit, MinusCircle, ChevronsUpDown, Check, Image as ImageIcon, Book as PassportIcon, Compass, Globe, Target, Map as MapIcon } from "lucide-react";
import { useContext, useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { format, parseISO, getMonth, getYear } from "date-fns";
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
import { cn, getCountry, getCity } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/context/auth-context";
import { ImageModal } from "@/components/ui/image-modal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PassportView } from "@/components/map/passport-view";
import { InstantSidebar } from "@/components/timeline/instant-sidebar";



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
    const { 
        instants, 
        deleteInstantsByLocation,
        dishes,
        encounters,
        accommodations
    } = useContext(TimelineContext);
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [manualLocations, setManualLocations] = useState<ManualLocation[]>([]);
    const [locationsWithCoords, setLocationsWithCoords] = useState<LocationWithCoords[]>([]);
    const [isLoadingCoords, setIsLoadingCoords] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [focusedLocation, setFocusedLocation] = useState<[number, number] | null>(null);
    const [locationToRedirect, setLocationToRedirect] = useState<LocationWithCoords | null>(null);

    // Filter states
    const [selectedMonth, setSelectedMonth] = useState<number>(-1); // -1 for "Voir tout"
    const [selectedYear, setSelectedYear] = useState<number>(-1); // -1 for "Toutes les années"

    // Passport state
    const [isPassportOpen, setIsPassportOpen] = useState(false);

    // Sidebar states
    const [selectedLocationForSidebar, setSelectedLocationForSidebar] = useState<LocationWithCoords | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);


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
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);

    const openImageModal = (images: string[], index: number) => {
        setSelectedImages(images);
        setSelectedImageIndex(index);
    };

    const closeImageModal = () => {
        setSelectedImageIndex(null);
        setSelectedImages([]);
    };

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
        if (user) {
            reloadManualLocations();
        }
    }, [user]);

    const instantLocations = useMemo(() => Array.from(new Set(instants.map(i => i.location))), [instants]);

    // Available filters based on instants
    const availableFilters = useMemo(() => {
        const years = new Set<number>();
        const months: { [year: number]: Set<number> } = {};

        instants.forEach(instant => {
            const date = parseISO(instant.date);
            const year = getYear(date);
            const month = getMonth(date);

            years.add(year);
            if (!months[year]) {
                months[year] = new Set<number>();
            }
            months[year].add(month);
        });

        return {
            years: Array.from(years).sort((a, b) => b - a),
            months,
        }
    }, [instants]);

    // Filter instants by year and month
    const filteredInstants = useMemo(() => {
        return instants.filter(instant => {
            const date = parseISO(instant.date);
            const isYearMatch = selectedYear === -1 || getYear(date) === selectedYear;
            const isMonthMatch = selectedMonth === -1 || getMonth(date) === selectedMonth;
            return isYearMatch && isMonthMatch;
        });
    }, [instants, selectedMonth, selectedYear]);

    const allLocations = useMemo(() => {
        const combined = new Map<string, {
            name: string,
            startDate?: string,
            endDate?: string,
            photos?: string[],
            souvenir?: string,
            instants: typeof instants
        }>();

        // Add manual locations
        manualLocations.forEach(l => {
            const cityName = getCity(l.name);
            const countryName = getCountry(l.name);
            if (!cityName || !countryName) return;
            const standardLocation = `${cityName}, ${countryName}`;
            const key = standardLocation.toLowerCase();
            
            combined.set(key, {
                ...l,
                name: standardLocation,
                instants: []
            });
        });

        // Group filtered instants by location
        filteredInstants.forEach(instant => {
            const cityName = getCity(instant.location);
            const countryName = getCountry(instant.location);
            if (!cityName || !countryName) return;
            const standardLocation = `${cityName}, ${countryName}`;
            const key = standardLocation.toLowerCase();
            
            if (combined.has(key)) {
                combined.get(key)!.instants.push(instant);
            } else {
                combined.set(key, {
                    name: standardLocation,
                    instants: [instant]
                });
            }
        });

        return Array.from(combined.values()).map(location => {
            const isManual = manualLocations.some(ml => {
                const mlCity = getCity(ml.name);
                const mlCountry = getCountry(ml.name);
                return `${mlCity}, ${mlCountry}`.toLowerCase() === location.name.toLowerCase();
            });
            return {
                ...location,
                count: location.instants.length,
                isManual
            }
        }).sort((a, b) => b.count - a.count);
    }, [manualLocations, filteredInstants]);

    useEffect(() => {
        const fetchCoordinates = async () => {
            setIsLoadingCoords(true);
            const coordsCache: { [key: string]: [number, number] } = JSON.parse(localStorage.getItem('coordsCache') || '{}');
            const newCoords: LocationWithCoords[] = [];

            // Helper for geocoding with multiple attempts and country validation
            const geocode = async (query: string, expectedCountry?: string): Promise<[number, number] | null> => {
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
                    const data = await response.json();
                    if (data && data.length > 0) {
                        // Country Guard: Verify match location is in the expected country
                        if (expectedCountry) {
                            const result = data[0];
                            // display_name usually contains the full address including country
                            const displayName = (result.display_name || "").toLowerCase();
                            const countryCheck = expectedCountry.toLowerCase();

                            // Basic check: Result must contain the country name
                            if (!displayName.includes(countryCheck)) {
                                console.warn(`Geocoding rejected: "${displayName}" does not match country "${expectedCountry}"`);
                                return null;
                            }
                        }
                        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                    }
                    return null;
                } catch (error) {
                    console.error(`Geocoding failed for ${query}`, error);
                    return null;
                }
            };

            for (const location of allLocations) {
                const locationKey = location.name.toLowerCase();
                if (coordsCache[locationKey]) {
                    newCoords.push({ ...location, coords: coordsCache[locationKey] });
                } else {
                    // Extract expected country if available (last part after comma)
                    let expectedCountry: string | undefined = undefined;
                    if (location.name.includes(',')) {
                        const parts = location.name.split(',');
                        const lastPart = parts[parts.length - 1].trim();
                        // Assume the last part is the country if it's not empty
                        if (lastPart.length > 0) {
                            expectedCountry = lastPart;
                        }
                    }

                    // Strategy 1: Try exact name
                    let coords = await geocode(location.name, expectedCountry);

                    // Strategy 2: If failed and has comma, try City + Space + Country
                    if (!coords && location.name.includes(',')) {
                        const parts = location.name.split(',').map(s => s.trim());
                        if (parts.length >= 2) {
                            const simplified = `${parts[0]} ${parts[parts.length - 1]}`;
                            coords = await geocode(simplified, expectedCountry);
                        }
                    }

                    // Strategy 3: Try just the City (first part) - BUT keep the country guard!
                    if (!coords && location.name.includes(',')) {
                        const city = location.name.split(',')[0].trim();
                        // This ensures "Feija" (Portugal) is rejected if we expect "Tunisie"
                        coords = await geocode(city, expectedCountry);
                    }

                    if (coords) {
                        coordsCache[locationKey] = coords;
                        newCoords.push({ ...location, coords });
                    }

                    // Small delay to respect API usage
                    await new Promise(r => setTimeout(r, 200));
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
            const country = getCountry(location.name) || 'Lieux non classés';
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
    
    const totalCountriesCount = useMemo(() => {
        const countriesSet = new Set<string>();
        allLocations.forEach((location: any) => {
            const country = getCountry(location.name);
            if (country) countriesSet.add(country.toLowerCase());
        });
        return countriesSet.size;
    }, [allLocations]);

    const totalCitiesCount = useMemo(() => {
        const citySet = new Set<string>();
        allLocations.forEach((location: any) => {
            const city = getCity(location.name);
            if (city) citySet.add(city.toLowerCase());
        });
        return citySet.size;
    }, [allLocations]);



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
                if (editedStartDate) updatedLoc.startDate = editedStartDate;
                if (editedEndDate) updatedLoc.endDate = editedEndDate;
                if (editedSouvenir) updatedLoc.souvenir = editedSouvenir;
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
        if (!user) return;
        const currentLocations = await getManualLocations(user.uid);
        const updatedManualLocations = currentLocations.filter(l => l.name !== locationName);
        await saveManualLocations(user.uid, updatedManualLocations);
        await reloadManualLocations();
        deleteInstantsByLocation(locationName); // Also delete associated instants
        toast({ title: "Lieu et souvenirs associés supprimés." });
    }

    const handlePhotoUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setPhotosCallback: React.Dispatch<React.SetStateAction<string[]>>
    ) => {
        const files = e.target.files;
        if (!files) return;

        setIsUploading(true);
        toast({ title: `Téléversement de ${files.length} photo(s)...` });

        const uploadedUrls: string[] = [];
        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append('file', file);
            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });
                if (!response.ok) throw new Error(`Upload failed for ${file.name}`);
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

    const handleMarkerClick = (location: LocationWithCoords) => {
        setFocusedLocation(location.coords);
        setSelectedLocationForSidebar(location);
        setIsSidebarOpen(true);
    };

    const confirmRedirection = () => {
        if (!locationToRedirect) return;

        const location = locationToRedirect;
        // Clean up location name for search (remove obvious country parts if needed, but keeping full name is usually safer for fuzzy match)
        // We will pass the full name and let the timeline page handle the fuzzy matching
        const searchName = location.name;

        // Redirect with location search parameter
        // We also pass manual flag to help timeline page decide solely on fallback
        const isManual = location.isManual ? 'true' : 'false';
        const souvenir = location.souvenir ? encodeURIComponent(location.souvenir) : '';

        router.push(`/?locationSearch=${encodeURIComponent(searchName)}&isManual=${isManual}&souvenir=${souvenir}`);
        setLocationToRedirect(null);
    };

    const monthNames = useMemo(() => Array.from({ length: 12 }, (_, i) => format(new Date(0, i), 'LLLL', { locale: fr })), []);

    return (
        <div className="container mx-auto px-4 py-6 sm:py-12 min-h-screen">
            {/* Header & Stats Dashboard */}
            <div className="pt-12 sm:pt-16 pb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-xl border border-amber-200">
                            <Compass className="h-6 w-6 text-amber-700 animate-spin-slow" />
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-serif font-black text-slate-900 tracking-tight">MA CARTE</h1>
                    </div>
                    <p className="text-slate-500 font-medium ml-1">L'odyssée de vos explorations à travers le monde.</p>
                </div>

                {/* Quick Stats Bar */}
                <div className="flex gap-3 sm:gap-6 flex-wrap">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1 text-right">Pays</span>
                        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
                            <Globe className="h-4 w-4 text-emerald-600" />
                            <span className="text-xl font-black text-slate-800">{totalCountriesCount}</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1 text-right">Villes</span>
                        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="text-xl font-black text-slate-800">{totalCitiesCount}</span>
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1 text-right">Couverture</span>
                        <div className="bg-slate-900 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2">
                            <Target className="h-4 w-4 text-amber-400" />
                            <span className="text-xl font-black text-white">{Math.min(100, Math.round((totalCountriesCount / 195) * 100))}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            {instants.length > 0 && (
                <div className="flex gap-4 mb-6">
                    <Select
                        value={String(selectedYear)}
                        onValueChange={(val) => {
                            const newYear = Number(val);
                            setSelectedYear(newYear);
                            setSelectedMonth(-1); // Reset to "Voir tout" when year changes
                        }}
                        disabled={availableFilters.years.length === 0}
                    >
                        <SelectTrigger className="bg-primary/20 border-primary/50 text-primary-foreground min-w-[140px]">
                            <SelectValue placeholder="Année" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={String(-1)}>Toutes les années</SelectItem>
                            {availableFilters.years.map(year => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={String(selectedMonth)}
                        onValueChange={(val) => setSelectedMonth(Number(val))}
                        disabled={selectedYear !== -1 && !availableFilters.months[selectedYear]}
                    >
                        <SelectTrigger className="bg-primary/20 border-primary/50 text-primary-foreground">
                            <SelectValue placeholder="Mois" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={String(-1)}>Voir tout</SelectItem>
                            {availableFilters.months[selectedYear] &&
                                Array.from(availableFilters.months[selectedYear]).sort((a, b) => b - a).map(month => (
                                    <SelectItem key={month} value={String(month)}>{monthNames[month]}</SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <Card className="mb-10 overflow-hidden rounded-3xl border-none shadow-2xl bg-white/40 backdrop-blur-md">
                <CardHeader className="pb-0 pt-6 px-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                         <MapIcon className="h-4 w-4" /> Vue Satellitaire
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                    <div className="rounded-2xl overflow-hidden border-4 border-white shadow-inner">
                        {isMounted && <InteractiveMap locations={locationsWithCoords} focusedLocation={focusedLocation} onMarkerClick={handleMarkerClick} />}
                        {!isMounted && <Skeleton className="h-[400px] w-full rounded-2xl" />}
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog for Marker Click */}
            <AlertDialog open={!!locationToRedirect} onOpenChange={(open) => !open && setLocationToRedirect(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{locationToRedirect?.name}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Souhaitez-vous voir les souvenirs associés à ce lieu dans votre journal ?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRedirection}>
                            Voir les souvenirs
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Centered Actions for desktop / Floating for mobile */}
            <div className="mb-12 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button 
                            disabled={!user} 
                            size="lg"
                            className="w-full sm:w-auto rounded-2xl bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 shadow-xl transition-all hover:scale-105"
                        >
                            <PlusCircle className="mr-3 h-5 w-5" />
                            Ajouter un lieu
                        </Button>
                    </DialogTrigger>
                    {/* ... (rest of the dialog content stays the same) */}
                    <DialogContent className="max-w-2xl rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-serif font-black uppercase">Nouveau Périple</DialogTitle>
                        </DialogHeader>
                        {/* Redacted dialog content same as before for brevity */}
                        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest opacity-50">Pays de destination</Label>
                                <Popover open={isCountryPopoverOpen} onOpenChange={setIsCountryPopoverOpen} modal={true}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isCountryPopoverOpen}
                                            className="w-full justify-between rounded-xl py-6"
                                        >
                                            {newCountry
                                                ? countries.find((country) => country.label.toLowerCase() === newCountry.toLowerCase())?.label
                                                : "Sélectionner un pays..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[110]" align="start">
                                        <Command filter={(value, search) => {
                                            const nv = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                            const ns = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                            return nv.includes(ns) ? 1 : 0;
                                        }}>
                                            <CommandInput placeholder="Rechercher un pays..." />
                                            <CommandList className="max-h-[200px] overflow-y-auto">
                                                <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                                                <CommandGroup>
                                                    {countries.map((country) => (
                                                        <CommandItem
                                                            key={country.value}
                                                            value={country.label}
                                                            onSelect={(currentValue) => {
                                                                const matchedCountry = countries.find(c => c.label.toLowerCase() === currentValue.toLowerCase());
                                                                if (matchedCountry) {
                                                                    setNewCountry(matchedCountry.label === newCountry ? "" : matchedCountry.label);
                                                                }
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
                                <Label className="text-xs font-black uppercase tracking-widest opacity-50">Villes visitées</Label>
                                {newCities.map((city, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input
                                            value={city}
                                            onChange={(e) => handleCityChange(index, e.target.value)}
                                            placeholder={`ex: Paris`}
                                            className="rounded-xl py-6"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveCity(index)}
                                            disabled={newCities.length <= 1}
                                            className="text-destructive h-12 w-12"
                                        >
                                            <MinusCircle className="h-5 w-5" />
                                        </Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" onClick={handleAddCity} className="mt-2 rounded-xl border-dashed">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Ajouter une ville
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-date" className="text-xs font-black uppercase tracking-widest opacity-50">Date de début</Label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={newStartDate}
                                        onChange={(e) => setNewStartDate(e.target.value)}
                                        className="rounded-xl py-6"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-date" className="text-xs font-black uppercase tracking-widest opacity-50">Date de fin</Label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={newEndDate}
                                        onChange={(e) => setNewEndDate(e.target.value)}
                                        className="rounded-xl py-6"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-widest opacity-50">Photos souvenirs</Label>
                                <div className="flex flex-wrap gap-2">
                                    {newPhotos.map((photo, index) => (
                                        <div key={index} className="relative group">
                                            <Image src={photo} alt={`Souvenir ${index + 1}`} width={100} height={100} className="rounded-xl object-cover w-24 h-24 border-2 border-white shadow-sm" />
                                            <Button type="button" size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 rounded-lg" onClick={() => removeNewPhoto(index)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="outline" onClick={() => addPhotoInputRef.current?.click()} className="w-full mt-2 rounded-xl py-6 border-dashed" disabled={isUploading}>
                                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                                    {isUploading ? "Envoi..." : "Ajouter des clichés"}
                                </Button>
                                <Input type="file" multiple accept="image/*,.heic,.heif" className="hidden" ref={addPhotoInputRef} onChange={(e) => handlePhotoUpload(e, setNewPhotos)} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="souvenir" className="text-xs font-black uppercase tracking-widest opacity-50">Votre récit</Label>
                                <Textarea
                                    id="souvenir"
                                    value={newSouvenir}
                                    onChange={(e) => setNewSouvenir(e.target.value)}
                                    placeholder="Un souvenir marquant..."
                                    className="rounded-xl min-h-[100px]"
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button variant="ghost" className="rounded-xl">Annuler</Button>
                            </DialogClose>
                            <Button onClick={handleAddLocations} disabled={isUploading} className="rounded-xl px-8">Valider</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>


            {/* Floating button for Passport (The "Bulle") */}
            <div className="fixed bottom-24 right-6 z-40">
                 <Button 
                    variant="outline" 
                    size="icon"
                    title="Mon Passeport Momenty"
                    className="h-16 w-16 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-2xl border-4 border-white transition-all hover:scale-110 active:scale-95 animate-bounce-slow"
                    onClick={() => setIsPassportOpen(true)}
                    disabled={!user}
                >
                    <PassportIcon className="h-6 w-6" />
                </Button>
            </div>

            {isPassportOpen && (
                <PassportView 
                    onClose={() => setIsPassportOpen(false)}
                    instants={instants}
                    dishes={dishes}
                    encounters={encounters}
                    accommodations={accommodations}
                    manualLocations={manualLocations}
                />
            )}

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
                                                            {/* Photo Gallery Restoration */}
                                                            {(() => {
                                                                const allPhotos = [
                                                                    ...(location.photos || []),
                                                                    ...(location.instants || []).flatMap(i => i.photos || [])
                                                                ].filter(Boolean);

                                                                if (allPhotos.length > 0) {
                                                                    return (
                                                                        <div className="flex flex-wrap gap-2 mt-4">
                                                                            {allPhotos.slice(0, 10).map((photo, pIdx) => (
                                                                                <div
                                                                                    key={pIdx}
                                                                                    className="relative w-16 h-16 rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                                                                                    onClick={() => openImageModal(allPhotos, pIdx)}
                                                                                >
                                                                                    <Image
                                                                                        src={photo}
                                                                                        alt={`Photo ${pIdx + 1} de ${location.name}`}
                                                                                        fill
                                                                                        className="object-cover"
                                                                                    />
                                                                                </div>
                                                                            ))}
                                                                            {allPhotos.length > 10 && (
                                                                                <div
                                                                                    className="w-16 h-16 rounded-md bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground cursor-pointer"
                                                                                    onClick={() => openImageModal(allPhotos, 10)}
                                                                                >
                                                                                    +{allPhotos.length - 10}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
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
                                                                                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
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
                                                                            <Button onClick={handleEditLocation} disabled={isUploading}>Sauvegarder</Button>
                                                                        </DialogFooter>
                                                                    </DialogContent>
                                                                </Dialog>
                                                            )}
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive">
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Supprimer ce lieu ?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Cette action est irréversible. Pour les lieux manuels, cela supprimera le lieu et ses infos.
                                                                            Pour les lieux générés depuis la timeline, cela supprimera tous les instants associés à ce lieu.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteLocation(location.name)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                            Supprimer
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </div>
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

            <ImageModal
                isOpen={selectedImageIndex !== null && selectedImages.length > 0}
                onClose={closeImageModal}
                images={selectedImages}
                initialIndex={selectedImageIndex || 0}
            />

            <InstantSidebar 
                isOpen={isSidebarOpen} 
                onClose={() => setIsSidebarOpen(false)} 
                location={selectedLocationForSidebar?.name || ""}
                instants={selectedLocationForSidebar?.instants || []}
                souvenir={selectedLocationForSidebar?.souvenir}
                photos={selectedLocationForSidebar?.photos}
            />
        </div>
    );
}

