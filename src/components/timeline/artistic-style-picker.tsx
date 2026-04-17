"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sliders, X, Sparkles, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type { PhotoFilterType } from "@/lib/types";
import { getPhotoFilterCss } from "@/lib/utils";

// ─── Photo Filter catalogue (6 filters using Cloudinary transformations) ──────────
export const photoFilters: { key: PhotoFilterType; label: string; icon: string; description: string; transform: string }[] = [
  { key: 'bw',       label: 'Noir & Blanc', icon: '◐', description: 'Niveaux de gris', transform: 'e_grayscale,e_contrast:30' },
  { key: 'sepia',    label: 'Sépia',        icon: '🟤', description: 'Teinte sépia', transform: 'e_sepia,e_contrast:12' },
    { key: 'fisheye',  label: 'Fisheye',      icon: '🐟', description: 'Simulation fisheye (vignette)', transform: 'e_vignette:80,e_saturation:30' },
    { key: 'vibrant',  label: 'Vibrant',      icon: '🎨', description: 'Saturation boost', transform: 'e_saturation:120,e_contrast:12' },
    { key: 'vintage',  label: 'Vintage',      icon: '📷', description: 'Sépia + trame', transform: 'e_sepia:80,e_vignette:60,e_contrast:28,e_saturation:-12' },
    { key: 'cinema',   label: 'Cinéma',       icon: '🎬', description: 'Teinte chaude', transform: 'e_sepia:30,e_contrast:16,e_vignette:30' },
];

// Helper to generate Cloudinary thumbnail URL with filter applied
function getFilterThumbnailUrl(photoUrl: string | null, transform: string): string | null {
  if (!photoUrl) {
    console.log('[Thumbnail] No photoUrl provided');
    return null;
  }
  if (!photoUrl.includes('res.cloudinary.com')) {
    console.log('[Thumbnail] Not a Cloudinary URL:', photoUrl.substring(0, 50));
    return photoUrl;
  }
  
  // Parse the Cloudinary URL properly
  // Format: https://res.cloudinary.com/{cloud}/image/upload/{transforms}/v{version}/{path}
  const match = photoUrl.match(/(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)/);
  if (!match) {
    console.log('[Thumbnail] URL regex match failed');
    return photoUrl;
  }
  
  const [, baseUrl, pathWithVersion] = match;
  const pathParts = pathWithVersion.split('/');
  
  // Find version segment (v123456...) - transformations are before it
  const versionIndex = pathParts.findIndex(part => /^v\d+$/.test(part));
  
  let cleanPath: string;
  if (versionIndex >= 0) {
    // Keep from version onwards (removes all existing transformations)
    cleanPath = pathParts.slice(versionIndex).join('/');
  } else {
    cleanPath = pathWithVersion;
  }
  
  // Build URL: transform + thumbnail sizing + clean path + cache buster
  const timestamp = Date.now();
  const thumbnailUrl = `${baseUrl}${transform},w_200,h_200,c_fill,q_auto/${cleanPath}?_cb=${timestamp}`;
  console.log(`[Thumbnail] Generated: ${thumbnailUrl.substring(0, 120)}...`);
  return thumbnailUrl;
}

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
    if (!photoUrl) {
      console.error('[Picker] No photoUrl provided');
      return;
    }
    
    console.log(`[Picker] Applying filter ${filter} to ${photoUrl}`);
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
      console.log('[Picker] API response:', data);

      if (!res.ok || !data.filteredUrl) {
        console.error('[Picker] Filter error:', data);
        setFilterState('error');
        return;
      }

      // Success - URL is generated instantly via Cloudinary transformation
      console.log('[Picker] Filter applied successfully:', data.filteredUrl);
      setFilteredUrl(data.filteredUrl);
      onFilteredUrlGenerated?.(data.filteredUrl);
      setFilterState('done');
      
    } catch (err) {
      console.error('[Picker] Filter application error:', err);
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={filteredUrl}
            src={filteredUrl}
            alt={`Filtre ${currentFilter?.label}`}
            className="object-contain w-full h-full transition-opacity duration-300"
            style={currentFilter ? { filter: getPhotoFilterCss(currentFilter.key) } : undefined}
            onError={() => console.error('[Preview] Failed to load filtered image:', filteredUrl.substring(0, 100))}
            onLoad={() => console.log('[Preview] Filtered image loaded successfully')}
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
            {photoFilters.map(({ key, label, icon, description, transform }) => {
              const thumbnailUrl = getFilterThumbnailUrl(photoUrl, transform);
              return (
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
                  <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted">
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt={label}
                        fill
                        className="object-cover"
                        sizes="120px"
                        unoptimized
                        onError={() => console.error(`[Thumbnail] Failed to load image for ${key}:`, thumbnailUrl.substring(0, 100))}
                        onLoad={() => console.log(`[Thumbnail] Successfully loaded for ${key}`)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-2xl">{icon}</span>
                      </div>
                    )}
                    {selectedFilter === key && !isApplying && (
                      <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                        <Check className="h-6 w-6 text-primary bg-white/80 rounded-full p-1" />
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
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            ☁️ Powered by Cloudinary · Transformations instantanées
          </p>
        </div>
      )}
    </div>
  );
}
