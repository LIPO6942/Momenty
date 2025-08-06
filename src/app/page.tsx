
"use client";

import React, { useContext, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TimelineContext } from "@/context/timeline-context";
import { InstantCard } from "@/components/timeline/instant-card";

export default function TimelinePage() {
  const { groupedInstants } = useContext(TimelineContext);

  const allDayKeys = useMemo(() => {
    return Object.keys(groupedInstants);
  }, [groupedInstants]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 min-h-screen">
       <div className="py-16 space-y-2">
        <h1 className="text-4xl font-bold text-primary">Bienvenue sur Momenty</h1>
        <p className="text-muted-foreground">Voici le résumé de vos voyages.</p>
      </div>

      <Accordion type="multiple" value={allDayKeys} className="w-full space-y-4">
        {Object.entries(groupedInstants).map(([day, dayData]) => (
          <AccordionItem key={day} value={day} className="border-none">
             <AccordionTrigger className="text-xl font-bold text-foreground mb-2 p-4 bg-card rounded-xl shadow-md shadow-slate-200/80 hover:no-underline">
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
    </div>
  );
}
