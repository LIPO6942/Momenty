"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sliders, X, Sparkles, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { PhotoFilterType } from "@/lib/types";

// ─── Photo Filter catalogue (6 filters using Cloudinary transformations) ──────────
export const photoFilters: { key: PhotoFilterType; label: string; icon: string; description: string }[] = [
  { key: 'bw',       label: 'Noir & Blanc', icon: '◐', description: 'Niveaux de gris' },
  { key: 'sepia',    label: 'Sépia',        icon: '🟤', description: 'Teinte vintage' },
  { key: 'contrast', label: 'Contraste++',  icon: '◐', description: 'Contraste élevé' },
  { key: 'vibrant',  label: 'Vibrant',      icon: '🎨', description: 'Saturation boost' },
  { key: 'vintage',  label: 'Vintage',      icon: '📷', description: 'Sépia + vignette' },
  { key: 'dramatic', label: 'Dramatique',   icon: '🎭', description: 'Fort contraste' },
];

interface PhotoFilterPickerProps {
  photoUrl: string | null;
  selectedFilter: PhotoFilterType | null;
  onFilterSelect: (filter: PhotoFilterType | null) => void;
  onFilteredUrlGenerated?: (filteredUrl: string) => void;
}

type FilterState = 'idle' | 'applying' | 'done' | 'error';

export function ArtisticStylePicker({
  photoUrl,
  selectedFilter,
  onFilterSelect,
  onFilteredUrlGenerated,
}: PhotoFilterPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filteredUrl, setFilteredUrl] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<FilterState>('idle');
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number>(16/9);

  // ─── Get original image aspect ratio ────────────────────────────────────────
  useEffect(() => {
    if (!photoUrl) return;
    const img = new (window as any).Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      setOriginalAspectRatio(ratio);
    };
    img.src = photoUrl;
  }, [photoUrl]);

  // ─── Apply filter via API ───────────────────────────────────────────────────
  const applyFilter = useCallback(async (filter: PhotoFilterType) => {
    if (!photoUrl) return;
    
    setFilterState('applying');
    
    try {
      const res = await fetch('/api/artistic-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          photoUrl: photoUrl, 
          filter,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.filteredUrl) {
        console.error('Filter error:', data);
        setFilterState('error');
        return;
      }

      // Success - URL is generated instantly via Cloudinary transformation
      setFilteredUrl(data.filteredUrl);
      onFilteredUrlGenerated?.(data.filteredUrl);
      setFilterState('done');
      
    } catch (err) {
      console.error('Filter application error:', err);
      setFilterState('error');
    }
  }, [photoUrl, onFilteredUrlGenerated]);

  // ─── Handle filter selection ───────────────────────────────────────────────────
  const handleFilterSelect = async (filter: PhotoFilterType | null) => {
    onFilterSelect(filter);
    setIsExpanded(false);

    if (!filter || !photoUrl) {
      setFilteredUrl(null);
      setFilterState('idle');
      return;
    }

    // Apply filter immediately
    applyFilter(filter);
  };

  if (!photoUrl) return null;

  const isApplying = filterState === 'applying';
  const currentFilter = photoFilters.find(f => f.key === selectedFilter);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
          <Sliders className="h-4 w-4" />
          Filtre Photo
        </Label>

        {selectedFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onFilterSelect(null);
              setFilteredUrl(null);
              setFilterState('idle');
            }}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Retirer
          </Button>
        )}
      </div>

      {/* Preview of filtered image - with dynamic aspect ratio */}
      {selectedFilter && filteredUrl && filterState === 'done' && (
        <div 
          className="relative w-full rounded-xl overflow-hidden bg-muted border-2 border-primary/30"
          style={{ aspectRatio: originalAspectRatio }}
        >
          <Image
            src={filteredUrl}
            alt={`Filtre ${currentFilter?.label}`}
            fill
            className="object-contain transition-opacity duration-300"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-white">
                {currentFilter?.icon} {currentFilter?.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Applying state */}
      {isApplying && (
        <div className="flex items-center gap-3 py-4 px-4 bg-primary/5 border border-primary/20 rounded-xl">
          <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Application du filtre…</p>
            <p className="text-xs text-muted-foreground">
              Transformation Cloudinary en cours
            </p>
          </div>
        </div>
      )}

      {/* Main toggle button */}
      {!isExpanded ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(true)}
          disabled={isApplying}
          className={cn(
            "w-full py-6 border-dashed rounded-xl transition-all",
            selectedFilter && "border-primary bg-primary/5",
            isApplying && "opacity-50 cursor-not-allowed"
          )}
        >
          {isApplying ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Application en cours…</span>
            </div>
          ) : selectedFilter ? (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {currentFilter?.icon} {currentFilter?.label}
              </span>
            </div>
          ) : (
            <>
              <Sliders className="h-4 w-4 mr-2" />
              <span className="text-sm">Ajouter un filtre photo</span>
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-3 p-4 border rounded-xl bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Choisissez un filtre</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {photoFilters.map(({ key, label, icon, description }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleFilterSelect(selectedFilter === key ? null : key)}
                disabled={isApplying}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                  selectedFilter === key
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:border-muted bg-background hover:bg-muted",
                  isApplying && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center">
                  <span className="text-2xl">{icon}</span>
                  {selectedFilter === key && !isApplying && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium truncate w-full text-center">
                  {label}
                </span>
                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {description}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            ☁️ Powered by Cloudinary · Transformations instantanées
          </p>
        </div>
      )}
    </div>
  );
}
