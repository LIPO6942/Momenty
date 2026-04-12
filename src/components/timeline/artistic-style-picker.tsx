"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { artisticStyles, buildArtisticTransform, type ArtisticStyleKey } from "@/lib/cloudinary";
import { Palette, X, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ArtisticStylePickerProps {
  photoUrl: string | null;
  selectedStyle: ArtisticStyleKey | null;
  onStyleSelect: (style: ArtisticStyleKey | null) => void;
  onArtisticUrlGenerated?: (artisticUrl: string) => void;
}

export function ArtisticStylePicker({
  photoUrl,
  selectedStyle,
  onStyleSelect,
  onArtisticUrlGenerated,
}: ArtisticStylePickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Record<ArtisticStyleKey, string>>({} as Record<ArtisticStyleKey, string>);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate preview URLs when photoUrl changes
  useEffect(() => {
    if (!photoUrl) {
      setPreviewUrls({} as Record<ArtisticStyleKey, string>);
      return;
    }

    const urls: Record<ArtisticStyleKey, string> = {} as Record<ArtisticStyleKey, string>;
    artisticStyles.forEach(({ key }) => {
      urls[key] = buildArtisticTransform(photoUrl, key, { w: 150, h: 150, c: 'fill' });
    });
    setPreviewUrls(urls);
  }, [photoUrl]);

  // Generate full artistic URL when style is selected
  useEffect(() => {
    if (selectedStyle && photoUrl && onArtisticUrlGenerated) {
      setIsGenerating(true);
      const artisticUrl = buildArtisticTransform(photoUrl, selectedStyle, { w: 1200, h: 900, c: 'fill' });
      // Simulate slight delay for better UX
      setTimeout(() => {
        onArtisticUrlGenerated(artisticUrl);
        setIsGenerating(false);
      }, 300);
    }
  }, [selectedStyle, photoUrl, onArtisticUrlGenerated]);

  if (!photoUrl) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Version Artistique
        </Label>
        {selectedStyle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStyleSelect(null)}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Retirer
          </Button>
        )}
      </div>

      {/* Aperçu du style sélectionné */}
      {selectedStyle && photoUrl && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border-2 border-primary/30">
          <Image
            src={previewUrls[selectedStyle] || photoUrl}
            alt="Aperçu du style artistique"
            fill
            className="object-cover transition-opacity duration-500"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {artisticStyles.find(s => s.key === selectedStyle)?.emoji}
              </span>
              <span className="text-sm font-medium text-white">
                Aperçu: {artisticStyles.find(s => s.key === selectedStyle)?.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {!isExpanded ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(true)}
          className={cn(
            "w-full py-6 border-dashed rounded-xl transition-all",
            selectedStyle && "border-primary bg-primary/5"
          )}
        >
          {selectedStyle ? (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {artisticStyles.find(s => s.key === selectedStyle)?.emoji} {' '}
                {artisticStyles.find(s => s.key === selectedStyle)?.label}
              </span>
            </div>
          ) : (
            <>
              <Palette className="h-4 w-4 mr-2" />
              <span className="text-sm">Ajouter une version artistique</span>
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-3 p-4 border rounded-xl bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Choisissez un style</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(false)}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isGenerating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération de la version artistique...
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {artisticStyles.map(({ key, label, emoji }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onStyleSelect(selectedStyle === key ? null : key);
                  if (selectedStyle !== key) {
                    setTimeout(() => setIsExpanded(false), 400);
                  }
                }}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                  selectedStyle === key
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:border-muted bg-background hover:bg-muted"
                )}
              >
                <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted">
                  {previewUrls[key] ? (
                    <Image
                      src={previewUrls[key]}
                      alt={label}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">
                      {emoji}
                    </div>
                  )}
                  {selectedStyle === key && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium truncate w-full text-center">
                  {emoji} {label}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            La version artistique sera accessible via un appui long sur la photo
          </p>
        </div>
      )}
    </div>
  );
}
