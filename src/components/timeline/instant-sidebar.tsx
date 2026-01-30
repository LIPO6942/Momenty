"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstantCard } from "@/components/timeline/instant-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Instant } from "@/lib/types";

interface InstantSidebarProps {
    location: string;
    instants: Instant[];
    isOpen: boolean;
    onClose: () => void;
}

export const InstantSidebar = ({
    location,
    instants,
    isOpen,
    onClose
}: InstantSidebarProps) => {
    return (
        <>
            {/* Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-40 transition-opacity",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={cn(
                "fixed right-0 top-0 h-full w-full md:w-[480px] bg-background shadow-2xl z-50 transform transition-transform duration-300",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                {/* Header */}
                <div className="p-6 border-b flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gradient-blue">{location}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {instants.length} souvenir{instants.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Instants List */}
                <ScrollArea className="h-[calc(100vh-100px)]">
                    <div className="p-6 space-y-6">
                        {instants.length > 0 ? (
                            instants.map(instant => (
                                <InstantCard key={instant.id} instant={instant} />
                            ))
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>Aucun souvenir associé à ce lieu.</p>
                                <p className="text-sm mt-2">Les lieux manuels n&apos;ont pas forcément d&apos;instants.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </>
    );
};
