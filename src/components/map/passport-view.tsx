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
  Compass,
  ArrowRight
} from "lucide-react";
import { 
  countryToContinent, 
  continents as continentData, 
  getExplorerGrade,
  getContinentBadges,
  ContinentBadge
} from "@/lib/continents";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseISO, getHours, format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn, getCountry, getCity } from "@/lib/utils";
import { Instant, Dish, Encounter, Accommodation } from "@/lib/types";

interface PassportViewProps {
  onClose: () => void;
  instants: Instant[];
  dishes: Dish[];
  encounters: Encounter[];
  accommodations: Accommodation[];
  manualLocations: any[];
}

interface VisaData {
  name: string;
  firstVisit: string;
  type: 'country' | 'city';
}

const VisaCard = ({ visa, index, color }: { visa: VisaData, index: number, color: 'emerald' | 'blue' | 'amber' }) => {
  const rotation = (index % 2 === 0 ? -2 : 2) + (index % 3);
  
  const colorClasses = {
    emerald: "text-emerald-700/60 border-emerald-700/60 bg-emerald-50 text-emerald-900 border-emerald-200",
    blue: "text-blue-700/60 border-blue-700/60 bg-blue-50 text-blue-900 border-blue-200",
    amber: "text-amber-700/60 border-amber-700/60 bg-amber-50 text-amber-900 border-amber-200",
  };

  const stampColor = color === 'emerald' ? "text-emerald-800/70" : "text-blue-800/70";

  let formattedDateShort = "??.??.??";
  let formattedDateLong = "Date inconnue";
  
  try {
    if (visa.firstVisit) {
      const dateObj = parseISO(visa.firstVisit);
      formattedDateShort = format(dateObj, 'dd.MM.yy');
      formattedDateLong = format(dateObj, 'd MMMM yyyy', { locale: fr });
    }
  } catch (e) {
    console.error("Error formatting visa date", e);
  }

  return (
    <div 
      className={cn(
        "relative p-4 rounded-xl border-2 shadow-sm transition-all hover:shadow-md group overflow-hidden bg-white/60",
        color === 'emerald' ? "border-emerald-100 hover:border-emerald-300" : "border-blue-100 hover:border-blue-300"
      )}
    >
      {/* The Stamp Background */}
      <div className={cn(
        "absolute -top-2 -right-2 pointer-events-none opacity-40 transform-gpu group-hover:scale-110 transition-transform duration-500",
        stampColor
      )} style={{ transform: `rotate(${rotation}deg)` }}>
          <div className="border-4 border-current rounded-full p-2 flex flex-col items-center justify-center w-28 h-28 transform rotate-12">
              <span className="text-[8px] font-bold uppercase tracking-widest">ADMIS</span>
              <span className="text-[10px] font-black my-0.5">{formattedDateShort}</span>
              <div className="h-[1px] w-full bg-current mb-0.5" />
              <span className="text-[10px] font-serif font-black uppercase text-center leading-tight truncate px-1 max-w-full">{visa.name}</span>
          </div>
      </div>

      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          {visa.type === 'country' ? <Globe className="h-4 w-4 text-emerald-600" /> : <MapPin className="h-4 w-4 text-blue-600" />}
          <h4 className="font-serif font-black text-lg text-slate-800 leading-tight truncate">{visa.name}</h4>
        </div>
        
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <Calendar className="h-3 w-3" />
          <span>Visé le {formattedDateLong}</span>
        </div>

        <div className="mt-2 flex justify-end">
            <span className={cn(
              "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border",
              color === 'emerald' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-blue-100 text-blue-700 border-blue-200"
            )}>
              VISA Momenty #{(index + 400).toString(16).toUpperCase()}
            </span>
        </div>
      </div>
    </div>
  );
};

export const PassportView = ({ 
  onClose, 
  instants, 
  dishes, 
  encounters, 
  accommodations,
  manualLocations 
}: PassportViewProps) => {

  const continentStats = useMemo(() => {
    const stats: Record<string, { visited: number; total: number; icon: string }> = {};
    continentData.forEach(c => {
      stats[c.id] = { visited: 0, total: c.totalCountries, icon: c.icon };
    });
    const visitedCountries = new Set<string>();
    instants.forEach(i => { const c = getCountry(i.location); if (c) visitedCountries.add(c); });
    manualLocations.forEach(m => { const c = getCountry(m.name); if (c) visitedCountries.add(c); });
    visitedCountries.forEach(country => {
      // Try exact, then try with trimmed whitespace
      const normalizedCountry = country.trim();
      const continent = countryToContinent[normalizedCountry] || 
                        countryToContinent[normalizedCountry.charAt(0).toUpperCase() + normalizedCountry.slice(1).toLowerCase()];
      
      if (continent && stats[continent]) stats[continent].visited += 1;
    });
    return stats;
  }, [instants, manualLocations]);

  const countryVisas = useMemo(() => {
    const countries = new Set<string>();
    instants.forEach(i => { const c = getCountry(i.location); if (c) countries.add(c); });
    manualLocations.forEach(m => { const c = getCountry(m.name); if (c) countries.add(c); });
    
    return Array.from(countries).sort().map(name => {
      let firstVisit = new Date().toISOString();
      const iDates = instants.filter(i => getCountry(i.location) === name).map(i => i.date);
      const mDates = manualLocations.filter(m => getCountry(m.name) === name).map(m => m.startDate);
      const allDates = [...iDates, ...mDates].filter(Boolean).sort() as string[];
      if (allDates.length > 0) firstVisit = allDates[0];
      return { name, firstVisit, type: 'country' } as VisaData;
    });
  }, [instants, manualLocations]);

  const cityVisas = useMemo(() => {
    const locationsMap = new Map<string, { firstVisit: string; name: string }>();
    
    instants.forEach(i => {
      const cityName = getCity(i.location);
      if (!cityName) return;
      const key = cityName.toLowerCase();
      if (!locationsMap.has(key) || i.date < locationsMap.get(key)!.firstVisit) {
        locationsMap.set(key, { 
          firstVisit: i.date, 
          name: cityName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        });
      }
    });
    
    manualLocations.forEach(m => {
      const cityName = getCity(m.name);
      if (!cityName) return;
      const key = cityName.toLowerCase();
      const mDate = m.startDate || new Date().toISOString();
      if (!locationsMap.has(key) || mDate < locationsMap.get(key)!.firstVisit) {
        locationsMap.set(key, { 
          firstVisit: mDate, 
          name: cityName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        });
      }
    });
    
    return Array.from(locationsMap.values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(entry => ({
        name: entry.name,
        firstVisit: entry.firstVisit,
        type: 'city'
      } as VisaData));
  }, [instants, manualLocations]);

  const explorerGrade = useMemo(() => {
    return getExplorerGrade(countryVisas.length, cityVisas.length);
  }, [countryVisas, cityVisas]);

  const earnedBadges = useMemo(() => {
    const badges: { title: string; icon: string; color: string; description: string }[] = [];
    
    // Continent Badges
    Object.entries(continentStats).forEach(([id, stats]) => {
      const continentBadges = getContinentBadges(id, stats.visited);
      continentBadges.forEach(b => {
        badges.push({ 
          title: b.title, 
          icon: b.icon, 
          color: b.color,
          description: `Débloqué pour ${stats.visited} pays en ${id}`
        });
      });
    });

    // Activity Badges
    if (dishes.length >= 10) badges.push({ title: "Grand Gourmand", icon: "🍱", color: "text-orange-500", description: "Plus de 10 plats dégustés" });
    if (encounters.length >= 10) badges.push({ title: "L'Ami du Monde", icon: "🤝", color: "text-blue-500", description: "Plus de 10 rencontres" });
    if (instants.filter(i => i.photos && i.photos.length > 0).length >= 50) badges.push({ title: "Grand Reporteur", icon: "📸", color: "text-slate-600", description: "Plus de 50 photos capturées" });
    if (Object.keys(continentStats).filter(id => continentStats[id].visited > 0).length >= 5) badges.push({ title: "Intercontinental", icon: "✈️", color: "text-cyan-600", description: "5 continents visités" });

    return badges;
  }, [continentStats, dishes, encounters, instants]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl flex items-center justify-center p-2 sm:p-6">
      <Card className="w-full max-w-5xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col bg-[#FDF5E6] border-[#8B4513] border-4 sm:border-8 shadow-2xl relative rounded-3xl">
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />
        
        {/* Header */}
        <div className="bg-[#5C3A21] text-white px-4 sm:px-8 py-4 sm:py-6 flex justify-between items-center shadow-lg relative z-10 border-b-2 border-amber-900/20">
          <div className="flex items-center gap-3 sm:gap-5">
              <div className="bg-amber-100/10 p-2 sm:p-3 rounded-2xl border-2 border-dashed border-amber-200/30">
                <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-amber-200" />
              </div>
              <div>
                <h2 className="text-xl sm:text-3xl font-serif font-black tracking-tight leading-none">PASSEPORT MOMENTY</h2>
                <p className="text-amber-200/60 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mt-1">Traveler Authentication System</p>
              </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10 rounded-full h-8 w-8 sm:h-12 sm:w-12">
            <X className="h-5 w-5 sm:h-7 sm:w-7" />
          </Button>
        </div>

        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-10 sm:space-y-16 scrollbar-hide">
          {/* Dashboard Section */}
          <div className="space-y-6 sm:space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
              {/* Explorer Grade Card */}
              <Card className="lg:col-span-2 bg-white/60 backdrop-blur-sm border-[#8B4513]/10 shadow-xl p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between overflow-hidden relative group rounded-2xl">
                <div className="absolute -right-8 -bottom-8 opacity-5 transform rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                  <Compass className="h-32 w-32 sm:h-48 sm:w-48 text-[#8B4513]" />
                </div>
                <div className="space-y-4 sm:space-y-6 relative z-10 w-full sm:w-auto">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 sm:p-4 rounded-2xl bg-white shadow-inner flex items-center justify-center text-3xl sm:text-4xl", explorerGrade.color)}>
                        {explorerGrade.icon}
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#8B4513]/40">Grade d'Explorateur</p>
                      <h3 className={cn("text-2xl sm:text-4xl font-serif font-black", explorerGrade.color)}>{explorerGrade.title}</h3>
                    </div>
                  </div>
                  <div className="flex gap-3 sm:gap-4 flex-wrap">
                    <div className="bg-[#8B4513]/5 px-3 sm:px-4 py-2 rounded-xl border border-[#8B4513]/10 flex flex-col">
                      <span className="text-xs font-black text-[#8B4513]/40 uppercase leading-none mb-1 text-[8px] sm:text-[10px]">Pays</span>
                      <span className="text-xl sm:text-2xl font-black text-[#8B4513]">{countryVisas.length}</span>
                    </div>
                    <div className="bg-[#8B4513]/5 px-3 sm:px-4 py-2 rounded-xl border border-[#8B4513]/10 flex flex-col">
                      <span className="text-xs font-black text-[#8B4513]/40 uppercase leading-none mb-1 text-[8px] sm:text-[10px]">Villes</span>
                      <span className="text-xl sm:text-2xl font-black text-[#8B4513]">{cityVisas.length}</span>
                    </div>
                    <div className="bg-[#8B4513]/5 px-3 sm:px-4 py-2 rounded-xl border border-[#8B4513]/10 flex flex-col">
                      <span className="text-xs font-black text-[#8B4513]/40 uppercase leading-none mb-1 text-[8px] sm:text-[10px]">Moments</span>
                      <span className="text-xl sm:text-2xl font-black text-[#8B4513]">{instants.length}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* World Coverage Card */}
              <Card className="bg-[#5C3A21] text-[#FDF5E6] border-none shadow-xl p-4 sm:p-6 flex flex-col justify-center items-center text-center space-y-4 rounded-2xl">
                <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-amber-200" />
                </div>
                <div>
                   <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">Couverture Mondiale</p>
                   <h4 className="text-3xl sm:text-4xl font-black tracking-tighter">{Math.round((countryVisas.length / 195) * 100)}%</h4>
                </div>
                <div className="w-full space-y-2">
                    <Progress value={(countryVisas.length / 195) * 100} className="h-2 bg-white/10" />
                    <p className="text-[10px] font-bold italic opacity-40 text-right">Plus que {195 - countryVisas.length} pays !</p>
                </div>
              </Card>
            </div>

            {/* Continent Progress Row */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
                {continentData.map((c) => {
                  const stats = continentStats[c.id];
                  const percentage = Math.round((stats.visited / stats.total) * 100) || 0;
                  return (
                    <div key={c.id} className="bg-white/40 p-2 sm:p-3 rounded-2xl border border-[#8B4513]/5 flex flex-col items-center text-center space-y-2 hover:bg-white/80 transition-all hover:shadow-sm">
                        <span className="text-xl sm:text-2xl">{c.icon}</span>
                        <div>
                          <p className="text-[8px] sm:text-[10px] font-black uppercase text-[#8B4513]/30 leading-tight truncate w-full">{c.label}</p>
                          <p className="text-[10px] sm:text-xs font-black text-[#8B4513]">{stats.visited}/{stats.total}</p>
                        </div>
                        <Progress value={percentage} className="h-1 bg-[#8B4513]/10" />
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="h-px w-full bg-[#8B4513]/10" />

          {/* New Badges Section */}
          {earnedBadges.length > 0 && (
            <div className="space-y-6 sm:space-y-10">
              <div className="flex items-center gap-4">
                <h3 className="text-lg sm:text-2xl font-serif font-black text-amber-900 uppercase tracking-widest flex items-center gap-3">
                  <Award className="h-6 w-6 text-amber-600" />
                  Mes Trophées & Achievements
                </h3>
              </div>
              <div className="flex flex-wrap gap-4">
                {earnedBadges.map((badge, i) => (
                  <div key={i} className="bg-white/60 p-4 rounded-2xl border border-amber-200/50 shadow-sm flex items-center gap-4 hover:scale-105 transition-transform cursor-default group max-w-xs">
                    <div className="h-12 w-12 rounded-full bg-white shadow-inner flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">
                      {badge.icon}
                    </div>
                    <div>
                      <h4 className={cn("font-bold text-sm leading-tight", badge.color)}>{badge.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-px w-full bg-[#8B4513]/10" />

          {countryVisas.length === 0 && cityVisas.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                <Compass className="h-16 w-16 text-[#8B4513]/10 mb-4 animate-spin-slow" />
                <h3 className="text-xl font-serif font-black text-[#8B4513]">Passeport en attente de visa...</h3>
                <p className="text-slate-500 text-sm max-w-xs mx-auto italic">Explorez une ville ou un pays pour voir votre premier tampon officiel apparaître ici.</p>
            </div>
          ) : (
            <div className="space-y-16 sm:space-y-24">
              {/* Countries Section */}
              {countryVisas.length > 0 && (
                <div className="space-y-6 sm:space-y-10">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg sm:text-2xl font-serif font-black text-emerald-900 uppercase tracking-widest flex items-center gap-3">
                      <span className="h-1 sm:h-2 w-8 sm:w-12 bg-emerald-600 rounded-full" /> 
                      Mes Pays Visités
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {countryVisas.map((visa, idx) => (
                      <VisaCard key={visa.name} visa={visa} index={idx} color="emerald" />
                    ))}
                  </div>
                </div>
              )}

              {/* Cities Section */}
              {cityVisas.length > 0 && (
                <div className="space-y-6 sm:space-y-10 pb-10">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg sm:text-2xl font-serif font-black text-blue-900 uppercase tracking-widest flex items-center gap-3">
                      <span className="h-1 sm:h-2 w-8 sm:w-12 bg-blue-600 rounded-full" /> 
                      Mes Villes Explorées
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {cityVisas.map((visa, idx) => (
                      <VisaCard key={visa.name} visa={visa} index={idx} color="blue" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* Footer decoration */}
        <div className="bg-[#5C3A21]/5 p-4 sm:p-6 border-t border-[#8B4513]/10 flex justify-center items-center gap-4 relative z-10">
             <div className="h-px flex-1 bg-[#8B4513]/5" />
             <div className="flex items-center gap-3 opacity-30 group cursor-default">
                <Palmtree className="h-5 w-5 text-[#8B4513] group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-serif font-black text-[#8B4513] uppercase tracking-widest">CERTIFIÉ MOMENTY OFFICIAL</span>
             </div>
             <div className="h-px flex-1 bg-[#8B4513]/5" />
        </div>
      </Card>
    </div>
  );
};
