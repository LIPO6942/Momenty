"use client";

import React, { useMemo } from "react";
import { 
  X, 
  Utensils, 
  Users, 
  Palmtree, 
  Moon, 
  Sun, 
  Camera, 
  Map as MapIcon, 
  Award,
  Globe,
  MapPin,
  Calendar,
  Sparkles,
  Trophy,
  Target,
  Compass
} from "lucide-react";
import { 
  countryToContinent, 
  continents as continentData, 
  getExplorerGrade 
} from "@/lib/continents";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseISO, getHours, format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Instant, Dish, Encounter, Accommodation } from "@/lib/types";

interface PassportViewProps {
  onClose: () => void;
  instants: Instant[];
  dishes: Dish[];
  encounters: Encounter[];
  accommodations: Accommodation[];
  manualLocations: any[];
}

interface CountryData {
  name: string;
  instants: Instant[];
  dishes: Dish[];
  encounters: Encounter[];
  accommodations: Accommodation[];
  manualCities: string[];
  firstVisit: string;
}

export const PassportView = ({ 
  onClose, 
  instants, 
  dishes, 
  encounters, 
  accommodations,
  manualLocations 
}: PassportViewProps) => {

  const getCountry = (loc: string) => {
    if (!loc) return "";
    const parts = loc.split(",");
    return parts[parts.length - 1].trim();
  };

  const getCity = (loc: string) => {
    if (!loc) return "";
    const parts = loc.split(",");
    return parts[0].trim();
  };

  const continentStats = useMemo(() => {
    const stats: Record<string, { visited: number; total: number; icon: string }> = {};
    
    // Initialize stats
    continentData.forEach(c => {
      stats[c.id] = { visited: 0, total: c.totalCountries, icon: c.icon };
    });

    // Count visited countries by continent
    const visitedCountries = new Set<string>();
    instants.forEach(i => { const c = getCountry(i.location); if (c) visitedCountries.add(c); });
    manualLocations.forEach(m => { const c = getCountry(m.name); if (c) visitedCountries.add(c); });

    visitedCountries.forEach(country => {
      const continent = countryToContinent[country];
      if (continent && stats[continent]) {
        stats[continent].visited += 1;
      }
    });

    return stats;
  }, [instants, manualLocations]);

  const explorerGrade = useMemo(() => {
    const countriesSet = new Set<string>();
    const citiesSet = new Set<string>();
    instants.forEach(i => { 
      const c = getCountry(i.location);
      const ct = getCity(i.location);
      if (c) countriesSet.add(c); 
      if (ct) citiesSet.add(ct);
    });
    manualLocations.forEach(m => { 
      const c = getCountry(m.name);
      const ct = getCity(m.name);
      if (c) countriesSet.add(c); 
      if (ct) citiesSet.add(ct);
    });
    return getExplorerGrade(countriesSet.size, citiesSet.size);
  }, [instants, manualLocations]);

  const totalCountriesCount = useMemo(() => {
    const countriesSet = new Set<string>();
    instants.forEach(i => { const c = getCountry(i.location); if (c) countriesSet.add(c); });
    manualLocations.forEach(m => { const c = getCountry(m.name); if (c) countriesSet.add(c); });
    return countriesSet.size;
  }, [instants, manualLocations]);

  const totalCitiesCount = useMemo(() => {
    const citiesSet = new Set<string>();
    instants.forEach(i => { const c = getCity(i.location); if (c) citiesSet.add(c); });
    manualLocations.forEach(m => { const c = getCity(m.name); if (c) citiesSet.add(c); });
    return citiesSet.size;
  }, [instants, manualLocations]);

  const countryStats = useMemo(() => {
    const stats: Record<string, CountryData> = {};

    const getCountryFromLocation = (loc: string) => {
      const parts = loc.split(",");
      return parts[parts.length - 1].trim();
    };

    // Helper to add data
    const addData = (type: keyof CountryData, item: any) => {
      const locStr = item.location || item.name || "";
      const country = getCountryFromLocation(locStr);
      if (!stats[country]) {
        stats[country] = {
          name: country,
          instants: [],
          dishes: [],
          encounters: [],
          accommodations: [],
          manualCities: [],
          firstVisit: item.date || item.startDate || new Date().toISOString()
        };
      }
      
      if (Array.isArray(stats[country][type])) {
        (stats[country][type] as any[]).push(item);
      }

      // Update first visit
      const itemDate = item.date || item.startDate;
      if (itemDate && itemDate < stats[country].firstVisit) {
        stats[country].firstVisit = itemDate;
      }
    };

    instants.forEach(item => addData('instants', item));
    dishes.forEach(item => addData('dishes', item));
    encounters.forEach(item => addData('encounters', item));
    accommodations.forEach(item => addData('accommodations', item));
    
    manualLocations.forEach(loc => {
      const country = getCountryFromLocation(loc.name);
      if (!stats[country]) {
         stats[country] = {
          name: country,
          instants: [],
          dishes: [],
          encounters: [],
          accommodations: [],
          manualCities: [],
          firstVisit: loc.startDate || new Date().toISOString()
        };
      }
      const city = loc.name.split(",")[0].trim();
      if (!stats[country].manualCities.includes(city)) {
        stats[country].manualCities.push(city);
      }
    });

    return Object.values(stats).sort((a, b) => a.firstVisit.localeCompare(b.firstVisit));
  }, [instants, dishes, encounters, accommodations, manualLocations]);

  const getAchievements = (country: CountryData) => {
    const achievements = [];
    
    if (country.dishes.length >= 3) {
      achievements.push({ icon: <Utensils className="h-4 w-4" />, label: "Chef de Cuisine", desc: "A goûté plus de 3 plats locaux" });
    }
    if (country.encounters.length >= 2) {
      achievements.push({ icon: <Users className="h-4 w-4" />, label: "Papillon Social", desc: "S'est fait de nouveaux amis" });
    }
    
    const cityCount = new Set([
      ...country.instants.map(i => i.location.split(",")[0].trim()),
      ...country.manualCities
    ]).size;
    
    if (cityCount >= 3) {
      achievements.push({ icon: <Globe className="h-4 w-4" />, label: "Globe-Trotteur", desc: `A exploré ${cityCount} villes` });
    }

    const hasNightActivity = country.instants.some(i => {
      const hour = getHours(parseISO(i.date));
      return hour >= 23 || hour <= 4;
    });
    if (hasNightActivity) {
      achievements.push({ icon: <Moon className="h-4 w-4" />, label: "Hibou de Nuit", desc: "A vécu la vie nocturne" });
    }

    const hasEarlyActivity = country.instants.some(i => {
      const hour = getHours(parseISO(i.date));
      return hour >= 5 && hour <= 7;
    });
    if (hasEarlyActivity) {
      achievements.push({ icon: <Sun className="h-4 w-4" />, label: "Aube Dorée", desc: "Debout avec le soleil" });
    }

    const photoCount = country.instants.reduce((acc, i) => acc + (i.photos?.length || 0), 0);
    if (photoCount >= 10) {
      achievements.push({ icon: <Camera className="h-4 w-4" />, label: "Paparazzi", desc: `A capturé ${photoCount} clichés` });
    }

    if (country.accommodations.length >= 2) {
        achievements.push({ icon: <MapPin className="h-4 w-4" />, label: "Nomade", desc: "A testé plusieurs nids" });
    }

    return achievements;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col bg-[#FDF5E6] border-[#D2B48C] border-8 shadow-2xl relative">
        {/* Passport Texture Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />
        
        {/* Header */}
        <div className="bg-[#8B4513] text-white p-6 flex justify-between items-center shadow-lg relative z-10">
          <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-full border-2 border-dashed border-white/40">
                <Globe className="h-8 w-8 text-amber-200 animate-pulse" />
              </div>
              <div>
                <h2 className="text-3xl font-serif font-bold italic tracking-wider">Mon Passeport Momenty</h2>
                <p className="text-amber-200/80 text-sm font-medium">Archives Officielles des Globe-Trotteurs</p>
              </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-10 w-10">
            <X className="h-6 w-6" />
          </Button>
        </div>

        <CardContent className="flex-1 overflow-y-auto p-6 space-y-12">
          {/* Dashboard Section */}
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Explorer Grade Card */}
              <Card className="md:col-span-2 bg-gradient-to-br from-white/80 to-[#DEB887]/30 border-[#8B4513]/20 shadow-md p-6 flex items-center justify-between overflow-hidden relative group">
                <div className="absolute -right-8 -bottom-8 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">
                  <Compass className="h-40 w-40 text-[#8B4513]" />
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <Trophy className={cn("h-8 w-8", explorerGrade.color)} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#8B4513]/60 italic">Niveau d'Explorateur</p>
                      <h3 className={cn("text-3xl font-serif font-black", explorerGrade.color)}>{explorerGrade.title}</h3>
                    </div>
                  </div>
                      <div className="flex gap-4">
                    <div className="bg-white/40 px-3 py-1 rounded-full border border-[#8B4513]/10">
                      <span className="text-xl font-bold text-[#8B4513]">{totalCountriesCount}</span>
                      <span className="text-[10px] ml-1 uppercase text-[#8B4513]/60">Pays</span>
                    </div>
                    <div className="bg-white/40 px-3 py-1 rounded-full border border-[#8B4513]/10">
                      <span className="text-xl font-bold text-[#8B4513]">{totalCitiesCount}</span>
                      <span className="text-[10px] ml-1 uppercase text-[#8B4513]/60">Villes</span>
                    </div>
                    <div className="bg-white/40 px-3 py-1 rounded-full border border-[#8B4513]/10">
                        <span className="text-xl font-bold text-[#8B4513]">{instants.length}</span>
                        <span className="text-[10px] ml-1 uppercase text-[#8B4513]/60">Moments</span>
                    </div>
                  </div>
                </div>
                <div className="relative z-10 text-6xl opacity-50">{explorerGrade.icon}</div>
              </Card>

              {/* World Coverage Card */}
              <Card className="bg-[#8B4513] text-[#FDF5E6] border-none shadow-xl p-6 flex flex-col justify-center items-center text-center space-y-3">
                <Target className="h-8 w-8 text-amber-200" />
                <div>
                   <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Couverture Mondiale</p>
                   <h4 className="text-4xl font-black">{Math.round((totalCountriesCount / 195) * 100)}%</h4>
                </div>
                <Progress value={(totalCountriesCount / 195) * 100} className="h-2 bg-white/20" />
                <p className="text-[10px] italic opacity-60">Il vous reste 195 pays à découvrir !</p>
              </Card>
            </div>

            {/* Continent Progress Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {continentData.map((c: { id: string; label: string; totalCountries: number; icon: string }) => {
                  const stats = continentStats[c.id];
                  const percentage = Math.round((stats.visited / stats.total) * 100) || 0;
                  return (
                    <div key={c.id} className="bg-white/40 p-3 rounded-xl border border-[#D2B48C]/30 flex flex-col items-center text-center space-y-2 hover:bg-white/60 transition-colors">
                        <span className="text-2xl">{c.icon}</span>
                        <div>
                          <p className="text-[9px] font-black uppercase text-[#8B4513]/60 leading-tight truncate w-full">{c.label}</p>
                          <p className="text-xs font-bold text-[#8B4513]">{stats.visited}/{stats.total}</p>
                        </div>
                        <Progress value={percentage} className="h-1 bg-[#8B4513]/10" />
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="h-px w-full bg-[#8B4513]/10" />

          {countryStats.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-24 h-24 bg-[#DEB887]/30 rounded-full flex items-center justify-center border-4 border-dashed border-[#8B4513]/20">
                    <MapPin className="h-12 w-12 text-[#8B4513]/40" />
                </div>
                <div>
                    <h3 className="text-2xl font-serif font-bold text-[#8B4513]">Votre passeport est vide !</h3>
                    <p className="text-[#8B4513]/60 italic max-w-xs mx-auto">Commencez à explorer le monde et enregistrez vos souvenirs pour obtenir vos premiers tampons.</p>
                </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {countryStats.map((country: CountryData, idx: number) => {
                const achievements = getAchievements(country);
                const stampColors = ["text-red-700/60", "text-blue-700/60", "text-green-700/60", "text-purple-700/60", "text-teal-700/60"];
                const colorClass = stampColors[idx % stampColors.length];
                const rotation = (idx % 2 === 0 ? -3 : 3) + (idx % 3);

                return (
                  <div 
                    key={country.name} 
                    className="relative p-6 bg-white/50 rounded-lg border-2 border-[#D2B48C]/40 shadow-sm transition-transform hover:scale-[1.01]"
                  >
                    {/* The Stamp Background */}
                    <div className={cn(
                      "absolute -top-4 -right-4 pointer-events-none opacity-40 transform-gpu",
                      colorClass
                    )} style={{ transform: `rotate(${rotation}deg)` }}>
                        <div className="border-4 border-current rounded-full p-3 flex flex-col items-center justify-center w-36 h-36">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Admis</span>
                            <span className="text-sm font-black my-1">{format(parseISO(country.firstVisit), 'dd-MM-yyyy')}</span>
                            <div className="h-[1px] w-full bg-current mb-1" />
                            <span className="text-[12px] font-serif font-black uppercase text-center">{country.name}</span>
                        </div>
                    </div>

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-[#8B4513]/10 rounded-lg">
                            <MapIcon className="h-6 w-6 text-[#8B4513]" />
                         </div>
                         <h3 className="text-2xl font-serif font-bold text-[#8B4513]">{country.name}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-[#8B4513]/70 bg-[#DEB887]/20 p-2 rounded-md">
                           <Calendar className="h-4 w-4" />
                           <span>Premier jour : {format(parseISO(country.firstVisit), 'd MMM yyyy', { locale: fr })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#8B4513]/70 bg-[#DEB887]/20 p-2 rounded-md">
                           <Sparkles className="h-4 w-4" />
                           <span>{country.instants.length} Instants</span>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-2 text-[#8B4513] font-bold">
                           <Award className="h-5 w-5" />
                           <span className="text-sm uppercase tracking-wider">Distinctions Officielles</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {achievements.length > 0 ? achievements.map((ach, aIdx) => (
                            <div 
                                key={aIdx} 
                                className="group relative"
                            >
                                <Badge variant="outline" className="bg-[#F4A460]/20 border-[#8B4513]/30 text-[#8B4513] px-3 py-1 flex items-center gap-2 text-xs hover:bg-[#F4A460]/40 transition-colors">
                                    {ach.icon}
                                    {ach.label}
                                </Badge>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-[#8B4513] text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center">
                                    {ach.desc}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#8B4513]" />
                                </div>
                            </div>
                          )) : (
                            <p className="text-xs italic text-[#8B4513]/40">Aucune distinction enregistrée. Continuez l'exploration !</p>
                          )}
                        </div>
                      </div>

                      {/* Funny Footer for the page */}
                      <div className="pt-4 border-t border-[#D2B48C]/30 flex justify-between items-center text-[10px] uppercase font-bold text-[#8B4513]/40 tracking-tighter">
                          <span>Visa Momenty #{(idx + 1000).toString(16).toUpperCase()}</span>
                          <span>Autorité de Voyage Galactique</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Footer decoration */}
        <div className="bg-[#DEB887]/20 p-4 border-t border-[#D2B48C] flex justify-center items-center gap-3">
             <div className="h-px flex-1 bg-[#D2B48C]/40" />
             <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                <Palmtree className="h-4 w-4 text-[#8B4513]" />
                <span className="text-[10px] font-serif font-black text-[#8B4513] uppercase">Exploration sans limites</span>
             </div>
             <div className="h-px flex-1 bg-[#D2B48C]/40" />
        </div>
      </Card>
    </div>
  );
};
