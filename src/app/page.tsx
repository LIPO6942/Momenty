
"use client";

import React, { useContext, useMemo, useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimelineContext } from "@/context/timeline-context";
import { InstantCard } from "@/components/timeline/instant-card";
import { getProfile } from "@/lib/idb";
import { parseISO, getMonth, getYear, format } from "date-fns";
import { fr } from 'date-fns/locale';
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar } from "lucide-react";


export default function TimelinePage() {
  const { groupedInstants, instants } = useContext(TimelineContext);
  const [firstName, setFirstName] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<number>(-1); // -1 for "Voir tout"
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [hasSetInitialFilter, setHasSetInitialFilter] = useState(false);
  const [openDays, setOpenDays] = useState<string[]>([]);
  const { user, loading } = useAuth();
  const router = useRouter();


  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getProfile();
      if (profile && profile.firstName) {
        setFirstName(profile.firstName);
      }
    };
    loadProfile();
  }, []);

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

  useEffect(() => {
    if (instants.length > 0 && !hasSetInitialFilter) {
      const mostRecentInstantDate = parseISO(instants[0].date);
      setSelectedYear(getYear(mostRecentInstantDate));
      setSelectedMonth(-1); // Default to "Voir tout"
      setHasSetInitialFilter(true);
    }
  }, [instants, hasSetInitialFilter]);


  const filteredGroupedInstants = useMemo(() => {
    return Object.entries(groupedInstants)
      .filter(([dayKey]) => {
        const date = parseISO(dayKey);
        const isYearMatch = getYear(date) === selectedYear;
        const isMonthMatch = selectedMonth === -1 || getMonth(date) === selectedMonth;
        return isYearMatch && isMonthMatch;
      })
      .reduce((acc, [dayKey, dayData]) => {
        acc[dayKey] = dayData;
        return acc;
      }, {} as typeof groupedInstants);
  }, [groupedInstants, selectedMonth, selectedYear]);

  const allDayKeys = useMemo(() => {
    return Object.keys(filteredGroupedInstants);
  }, [filteredGroupedInstants]);

  useEffect(() => {
    setOpenDays(allDayKeys);
  }, [allDayKeys]);


  // ... imports

  // Helper to get location from a day's instants
  const getDayLocation = (instants: any[]) => {
    if (!instants || instants.length === 0) return null;
    // Return the location of the last instant (most recent in that day) or dominant location
    return instants[0].location;
  };

  const displayGroups = useMemo(() => {
    // 1. Convert to array and Sort by date descending
    const days = Object.entries(filteredGroupedInstants)
      .map(([dayKey, data]) => ({ dayKey, ...data }))
      .sort((a, b) => new Date(b.dayKey).getTime() - new Date(a.dayKey).getTime());

    const groups: { type: 'single' | 'trip', location?: string, days: typeof days }[] = [];

    if (days.length === 0) return [];

    let currentGroup: typeof days = [];
    let currentLocation: string | null = null;

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const dayLocation = getDayLocation(day.instants);

      if (currentGroup.length === 0) {
        currentGroup.push(day);
        currentLocation = dayLocation;
      } else {
        // Check if matches current group
        // We group if location exists and matches
        if (dayLocation && currentLocation && dayLocation.trim().toLowerCase() === currentLocation.trim().toLowerCase()) {
          currentGroup.push(day);
        } else {
          // Close current group
          if (currentGroup.length > 1 && currentLocation) {
            groups.push({ type: 'trip', location: currentLocation, days: currentGroup });
          } else {
            // Start adding them as singles. 
            // Verify if previous group was actually a 'single' or list of singles
            // Actually if length was 1, it is single.
            // If length > 1 but no location, it is singles.
            currentGroup.forEach(g => groups.push({ type: 'single', days: [g] }));
          }
          // Start new group
          currentGroup = [day];
          currentLocation = dayLocation;
        }
      }
    }

    // Handle last group
    if (currentGroup.length > 0) {
      if (currentGroup.length > 1 && currentLocation) {
        groups.push({ type: 'trip', location: currentLocation, days: currentGroup });
      } else {
        currentGroup.forEach(g => groups.push({ type: 'single', days: [g] }));
      }
    }

    return groups;
  }, [filteredGroupedInstants]);

  // Update openDays when filteredGroupedInstants changes, to allow all days to be open or managed
  // For simplicity, we can just let accordion manage itself or default to open all.
  // The original code did: setOpenDays(allDayKeys).
  // Now we have a more complex structure.
  // We can keep openDays as a list of dayKeys. The AccordionItem value is the dayKey.
  // This should still work if we render AccordionItems.

  const monthNames = useMemo(() => Array.from({ length: 12 }, (_, i) => format(new Date(0, i), 'LLLL', { locale: fr })), []);

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
        <div className="py-16 space-y-4 text-center">
          <Skeleton className="h-10 w-3/4 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
      <div className="py-16 space-y-2 text-center">
        <h1 className="text-4xl font-bold text-primary">
          {firstName ? `Bienvenue ${firstName} sur Momenty` : 'Bienvenue sur Momenty'}
        </h1>
        <p className="text-muted-foreground">Le journal de vos plus beaux souvenirs.</p>
      </div>

      <div className="flex gap-4 mb-8">
        <Select
          value={String(selectedYear)}
          onValueChange={(val) => {
            const newYear = Number(val);
            setSelectedYear(newYear);
            setSelectedMonth(-1); // Reset to "Voir tout" when year changes
          }}
          disabled={availableFilters.years.length === 0}
        >
          <SelectTrigger className="bg-primary/20 border-primary/50 text-primary-foreground">
            <SelectValue placeholder="Année" />
          </SelectTrigger>
          <SelectContent>
            {availableFilters.years.map(year => (
              <SelectItem key={year} value={String(year)}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(selectedMonth)}
          onValueChange={(val) => setSelectedMonth(Number(val))}
          disabled={!availableFilters.months[selectedYear]}
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

      {displayGroups.length > 0 ? (
        <Accordion type="multiple" value={openDays} onValueChange={setOpenDays} className="w-full space-y-8">
          {displayGroups.map((group, groupIndex) => {
            if (group.type === 'trip') {
              // Render a Trip Header and then the days
              const firstDayNum = group.days[group.days.length - 1].dayNumber;
              const lastDayNum = group.days[0].dayNumber;

              return (
                <div key={`group-${groupIndex}`} className="space-y-4 relative">
                  {/* Trip Header */}
                  <div className="flex items-center gap-4 py-2 sticky top-2 z-10 bg-background/80 backdrop-blur-sm rounded-lg pl-2">
                    <div className="h-10 w-1 bg-primary rounded-full"></div>
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" /> {group.location}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Jour {firstDayNum} - {lastDayNum}
                      </p>
                    </div>
                  </div>

                  {/* Days */}
                  <div className="pl-4 border-l-2 border-primary/20 space-y-4 ml-2">
                    {group.days.map((day) => (
                      <AccordionItem key={day.dayKey} value={day.dayKey} className="border-none">
                        <AccordionTrigger className="text-xl font-bold text-foreground mb-2 p-4 bg-card rounded-xl shadow-md shadow-slate-200/80 hover:no-underline">
                          {day.title}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-6 pt-4">
                            {day.instants.map((instant) => (
                              <InstantCard key={instant.id} instant={instant} />
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </div>
                </div>
              )
            }

            // Single Day
            const day = group.days[0];
            return (
              <AccordionItem key={day.dayKey} value={day.dayKey} className="border-none">
                <AccordionTrigger className="text-xl font-bold text-foreground mb-2 p-4 bg-card rounded-xl shadow-md shadow-slate-200/80 hover:no-underline">
                  {day.title}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-4">
                    {day.instants.map((instant) => (
                      <InstantCard key={instant.id} instant={instant} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <p>Aucun souvenir trouvé pour {selectedMonth === -1 ? selectedYear : `${monthNames[selectedMonth]} ${selectedYear}`}.</p>
          <p className="text-sm mt-1">Essayez de sélectionner une autre période.</p>
        </div>
      )}
    </div>
  );
}
