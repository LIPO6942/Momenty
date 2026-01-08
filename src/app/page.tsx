
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
              <AccordionTrigger
                className="text-xl font-bold mb-2 p-4 bg-card rounded-xl shadow-md shadow-slate-200/80 hover:no-underline"
                style={{
                  background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {dayData.title}
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
      )}
    </div>
  );
}
