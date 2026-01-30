"use client";

import React, { useContext, useMemo, useState, useEffect, Suspense } from "react";
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
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import stringSimilarity from "string-similarity";
import { useToast } from "@/hooks/use-toast";


function TimelineContent() {
  const { groupedInstants, instants } = useContext(TimelineContext);
  const [firstName, setFirstName] = useState<string | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<number>(-1); // -1 for "Voir tout"
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [hasSetInitialFilter, setHasSetInitialFilter] = useState(false);
  const [openDays, setOpenDays] = useState<string[]>([]);
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();


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
      const instantId = searchParams.get('instant');
      const locationSearch = searchParams.get('locationSearch');
      const souvenir = searchParams.get('souvenir');

      let targetInstant = null;

      if (instantId) {
        targetInstant = instants.find(i => i.id === instantId);
      } else if (locationSearch) {
        // Advanced Cascade Matching Strategy
        const normalizedFullSearch = locationSearch.toLowerCase();
        const searchParts = normalizedFullSearch.split(',').map(s => s.trim()).filter(s => s.length > 0);
        const mainCity = searchParts.length > 0 ? searchParts[0] : normalizedFullSearch;

        // 1. Priority: City Match (The first part of the location string)
        // Check if instant location contains the city name
        targetInstant = instants.find(i => {
          const loc = (i.location || "").toLowerCase();
          // Strict check for city at the start or distinct word to avoid false positives
          return loc.includes(mainCity);
        });

        // 2. Fallback: Component & Content Match Scoring
        if (!targetInstant) {
          const candidates = instants.map(i => {
            const loc = (i.location || "").toLowerCase();
            const title = (i.title || "").toLowerCase();
            const desc = (i.description || "").toLowerCase();
            let score = 0;

            // Check match for each part of the search string (e.g. "Lombok", "Indonesia")
            searchParts.forEach(part => {
              if (loc.includes(part)) score += 10;      // High relevance if in location
              if (title.includes(part)) score += 5;     // Medium relevance if in title
              if (desc.includes(part)) score += 3;      // Lower relevance if in description
            });

            // Add fuzzy similarity bonus for the full string on location matches
            const locSimilarity = stringSimilarity.compareTwoStrings(loc, normalizedFullSearch);
            if (locSimilarity > 0.4) score += locSimilarity * 5;

            return { instant: i, score };
          });

          // Sort by score descending
          candidates.sort((a, b) => b.score - a.score);

          // Threshold: We need at least some match
          if (candidates.length > 0 && candidates[0].score > 2) {
            targetInstant = candidates[0].instant;
          }
        }

        // If still not found, show toast
        if (!targetInstant) {
          toast({
            title: locationSearch,
            description: souvenir ? decodeURIComponent(souvenir) : "Lieu visité (aucun instant associé trouvé)"
          });
        }
      }

      // If we have a target instant from URL, set filter to its date
      if (targetInstant) {
        const date = parseISO(targetInstant.date);
        setSelectedYear(getYear(date));
        setSelectedMonth(-1); // "Voir tout" to make sure it's visible or handle specific month if preferred
        setHasSetInitialFilter(true);

        // Wait for render then scroll
        setTimeout(() => {
          const element = document.getElementById(`instant-${targetInstant.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
            }, 3000);
          }
        }, 500); // Small delay to ensure Accordion is expanded and rendered
      } else if (!hasSetInitialFilter) {
        // Default behavior if no instant matched (and we haven't set filter yet)
        const mostRecentInstantDate = parseISO(instants[0].date);
        setSelectedYear(getYear(mostRecentInstantDate));
        setSelectedMonth(-1);
        setHasSetInitialFilter(true);
      }
    }
  }, [instants, hasSetInitialFilter, searchParams, toast]);


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

      {allDayKeys.length > 0 ? (
        <Accordion type="multiple" value={openDays} onValueChange={setOpenDays} className="w-full space-y-4">
          {Object.entries(filteredGroupedInstants).map(([day, dayData]) => (
            <AccordionItem key={day} value={day} className="border-none">
              <AccordionTrigger className="text-xl font-bold mb-2 p-4 bg-card rounded-xl shadow-md shadow-slate-200/80 hover:no-underline">
                <span
                  style={{
                    background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    display: 'inline-block',
                  }}
                >
                  {dayData.title}
                </span>
              </AccordionTrigger>

              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {dayData.instants.map((instant) => (
                    <InstantCard key={instant.id} instant={instant} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          <p>Aucun souvenir trouvé pour {selectedMonth === -1 ? selectedYear : `${monthNames[selectedMonth]} ${selectedYear}`}.</p>
          <p className="text-sm mt-1">Essayez de sélectionner une autre période.</p>
        </div>
      )
      }
    </div >
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={
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
    }>
      <TimelineContent />
    </Suspense>
  );
}
