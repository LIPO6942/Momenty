"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Palette, X, Sparkles, Loader2, Wand2, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import type { ArtisticStyleType } from "@/lib/types";

// ─── Style catalogue (labels + emojis only, prompts are server-side) ──────────
export const artisticStyles: { key: ArtisticStyleType; label: string; emoji: string }[] = [
  { key: 'manga',      label: 'Manga',       emoji: '🌸' },
  { key: 'abstract',   label: 'Abstrait',    emoji: '🎨' },
  { key: 'vangogh',    label: 'Van Gogh',    emoji: '🌻' },
  { key: 'monet',      label: 'Monet',       emoji: '🌾' },
  { key: 'watercolor', label: 'Aquarelle',   emoji: '💧' },
  { key: 'comic',      label: 'Comic',       emoji: '💥' },
];

interface ArtisticStylePickerProps {
  photoUrl: string | null;
  selectedStyle: ArtisticStyleType | null;
  onStyleSelect: (style: ArtisticStyleType | null) => void;
  onArtisticUrlGenerated?: (artisticUrl: string) => void;
}

type GenerationState = 'idle' | 'generating' | 'retrying' | 'done' | 'error';

export function ArtisticStylePicker({
  photoUrl,
  selectedStyle,
  onStyleSelect,
  onArtisticUrlGenerated,
}: ArtisticStylePickerProps) {
  const [isExpanded, setIsExpanded]             = useState(false);
  const [generatedArtisticUrl, setGeneratedArtisticUrl] = useState<string | null>(null);
  const [genState, setGenState]                 = useState<GenerationState>('idle');
  const [retryCount, setRetryCount]             = useState(0);
  const [errorMsg, setErrorMsg]                 = useState<string | null>(null);

  // ─── Upload helper: detect if URL is already a Cloudinary URL ───────────────
  const isCloudinaryUrl = useCallback((url: string) =>
    url.includes('cloudinary.com') || url.includes('res.cloudinary.com'), []);

  // ─── Upload local blob to Cloudinary (needed if photoUrl is a data: URL) ────
  const ensureCloudinaryUrl = useCallback(async (url: string): Promise<string | null> => {
    if (isCloudinaryUrl(url)) return url;
    // It's a local data: URL → upload first
    try {
      const formData = new FormData();
      const blob = await (await fetch(url)).blob();
      formData.append('file', blob);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('upload failed');
      const data = await res.json();
      return data.secure_url as string;
    } catch {
      return null;
    }
  }, [isCloudinaryUrl]);

  // ─── Core generation function (called on first try + retries) ────────────────
  const generateArtistic = useCallback(async (
    style: ArtisticStyleType,
    cloudinaryPhotoUrl: string,
    attempt: number
  ) => {
    setGenState(attempt === 0 ? 'generating' : 'retrying');
    setErrorMsg(null);

    try {
      const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
        return new Promise((resolve) => {
          const img = new (window as any).Image();
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => resolve({ width: 1024, height: 1024 });
          img.src = url;
        });
      };

      const dims = await getImageDimensions(cloudinaryPhotoUrl);

      const res = await fetch('/api/artistic-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          photoUrl: cloudinaryPhotoUrl, 
          style,
          width: dims.width,
          height: dims.height
        }),
      });

      const data = await res.json();

      if (res.status === 503 || res.status === 504) {
        // Model cold start or timeout → one automatic retry after 30s
        if (attempt < 1) {
          setGenState('retrying');
          setRetryCount(a => a + 1);
          toast({
            title: "⏳ Modèle IA en démarrage…",
            description: "Première requête plus longue. Nouvelle tentative dans 30 secondes.",
          });
          setTimeout(() => generateArtistic(style, cloudinaryPhotoUrl, attempt + 1), 30000);
        } else {
          setGenState('error');
          setErrorMsg("Le modèle est encore en cours de chargement. Réessaie manuellement dans 1 minute.");
        }
        return;
      }

      if (!res.ok || !data.artisticUrl) {
        setGenState('error');
        setErrorMsg((data?.message || "Erreur de génération. Réessaie.") + (data?.details ? ` (${data.details})` : ""));
        return;
      }

      // Success!
      setGeneratedArtisticUrl(data.artisticUrl);
      onArtisticUrlGenerated?.(data.artisticUrl);
      setGenState('done');
      toast({ title: "🎨 Style artistique généré !" });

    } catch (err) {
      console.error('Artistic generation error:', err);
      setGenState('error');
      setErrorMsg("Erreur réseau. Vérifie ta connexion et réessaie.");
    }
  }, [onArtisticUrlGenerated]);

  // ─── Handle style selection ───────────────────────────────────────────────────
  const handleStyleSelect = async (style: ArtisticStyleType | null) => {
    onStyleSelect(style);
    setIsExpanded(false);

    if (!style || !photoUrl) {
      setGeneratedArtisticUrl(null);
      setGenState('idle');
      return;
    }

    // Ensure we have a public Cloudinary URL before calling our API
    toast({ title: "Préparation…", description: "Vérification de la photo en cours." });
    const cloudinaryUrl = await ensureCloudinaryUrl(photoUrl);
    if (!cloudinaryUrl) {
      toast({ variant: "destructive", title: "Impossible de préparer la photo." });
      return;
    }

    setRetryCount(0);
    generateArtistic(style, cloudinaryUrl, 0);
  };

  // ─── Manual retry ─────────────────────────────────────────────────────────────
  const handleManualRetry = async () => {
    if (!selectedStyle || !photoUrl) return;
    const cloudinaryUrl = await ensureCloudinaryUrl(photoUrl);
    if (!cloudinaryUrl) return;
    setRetryCount(0);
    generateArtistic(selectedStyle, cloudinaryUrl, 0);
  };

  if (!photoUrl) return null;

  const isGenerating = genState === 'generating' || genState === 'retrying';
  const currentStyle = artisticStyles.find(s => s.key === selectedStyle);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-black uppercase tracking-widest opacity-50 flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Version Artistique
        </Label>
        {selectedStyle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onStyleSelect(null);
              setGeneratedArtisticUrl(null);
              setGenState('idle');
            }}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
          >
            <X className="h-3 w-3 mr-1" />
            Retirer
          </Button>
        )}
      </div>

      {/* Preview of generated image */}
      {selectedStyle && generatedArtisticUrl && genState === 'done' && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border-2 border-primary/30">
          <Image
            src={generatedArtisticUrl}
            alt="Version artistique générée"
            fill
            className="object-cover transition-opacity duration-500"
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-white">
                {currentStyle?.emoji} {currentStyle?.label} — Tableau IA
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Generation status */}
      {isGenerating && (
        <div className="flex items-center gap-3 py-4 px-4 bg-primary/5 border border-primary/20 rounded-xl">
          <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">
              {genState === 'retrying'
                ? `Nouvelle tentative… (modèle en démarrage)`
                : `Transformation en ${currentStyle?.label ?? 'tableau'}…`}
            </p>
            <p className="text-xs text-muted-foreground">
              {genState === 'retrying'
                ? 'Le modèle HuggingFace est en cold start, patienter ~30s'
                : 'L\'IA analyse et transpose ta photo. 20–60 secondes.'}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {genState === 'error' && (
        <div className="flex items-start gap-3 py-3 px-4 bg-destructive/5 border border-destructive/20 rounded-xl">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Génération échouée</p>
            <p className="text-xs text-muted-foreground mt-0.5">{errorMsg}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRetry}
            className="flex-shrink-0 h-7 px-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Réessayer
          </Button>
        </div>
      )}

      {/* Main toggle button */}
      {!isExpanded ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(true)}
          disabled={isGenerating}
          className={cn(
            "w-full py-6 border-dashed rounded-xl transition-all",
            selectedStyle && "border-primary bg-primary/5",
            isGenerating && "opacity-50 cursor-not-allowed"
          )}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Génération en cours…</span>
            </div>
          ) : selectedStyle ? (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {currentStyle?.emoji} {currentStyle?.label}
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

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {artisticStyles.map(({ key, label, emoji }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleStyleSelect(selectedStyle === key ? null : key)}
                disabled={isGenerating}
                className={cn(
                  "relative flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                  selectedStyle === key
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:border-muted bg-background hover:bg-muted",
                  isGenerating && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="relative w-full aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center">
                  <span className="text-3xl">{emoji}</span>
                  {selectedStyle === key && !isGenerating && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Wand2 className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium truncate w-full text-center">
                  {label}
                </span>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            ✨ Powered by HuggingFace · Photo originale transformée en tableau IA
          </p>
        </div>
      )}
    </div>
  );
}
