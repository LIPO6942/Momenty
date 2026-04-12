"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { deepAIStyles, generateArtisticImage, type DeepAIStyleKey } from "@/lib/deepai";
import { Palette, X, Sparkles, Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";

interface ArtisticStylePickerProps {
  photoUrl: string | null;
  selectedStyle: DeepAIStyleKey | null;
  onStyleSelect: (style: DeepAIStyleKey | null) => void;
  onArtisticUrlGenerated?: (artisticUrl: string) => void;
}

// Upload a photo to Cloudinary and return the secure URL
async function uploadPhotoToCloudinary(dataUrl: string): Promise<string | null> {
  try {
    const formData = new FormData();
    const blob = await (await fetch(dataUrl)).blob();
    formData.append('file', blob);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.secure_url;
  } catch (error) {
    console.error('Failed to upload photo:', error);
    return null;
  }
}

export function ArtisticStylePicker({
  photoUrl,
  selectedStyle,
  onStyleSelect,
  onArtisticUrlGenerated,
}: ArtisticStylePickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [generatedArtisticUrl, setGeneratedArtisticUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);

  // Get DeepAI API key from environment
  const getDeepAIKey = () => {
    // In production, this should be set in your environment variables
    // For now, we'll check if a key is available in localStorage (for demo purposes)
    if (typeof window !== 'undefined') {
      return localStorage.getItem('DEEPAI_API_KEY') || process.env.NEXT_PUBLIC_DEEPAI_API_KEY || '';
    }
    return '';
  };

  // Check if photoUrl is a Cloudinary URL
  const isCloudinaryUrl = useCallback((url: string): boolean => {
    return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
  }, []);

  // Upload local photo to Cloudinary when needed
  useEffect(() => {
    if (!photoUrl) {
      setUploadedPhotoUrl(null);
      return;
    }

    // If already a Cloudinary URL, use it directly
    if (isCloudinaryUrl(photoUrl)) {
      setUploadedPhotoUrl(photoUrl);
      return;
    }

    // Otherwise, upload the local photo
    const uploadPhoto = async () => {
      setIsUploading(true);
      const uploadedUrl = await uploadPhotoToCloudinary(photoUrl);
      if (uploadedUrl) {
        setUploadedPhotoUrl(uploadedUrl);
      } else {
        toast({
          variant: "destructive",
          title: "Échec de l'upload",
          description: "Impossible d'uploader la photo pour la génération artistique."
        });
      }
      setIsUploading(false);
    };

    uploadPhoto();
  }, [photoUrl, isCloudinaryUrl]);

  // Generate artistic image when style is selected
  const handleStyleSelect = async (style: DeepAIStyleKey | null) => {
    onStyleSelect(style);
    
    if (!style || !uploadedPhotoUrl) {
      setGeneratedArtisticUrl(null);
      return;
    }

    const apiKey = getDeepAIKey();
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "Clé API manquante",
        description: "Veuillez configurer votre clé API DeepAI dans les paramètres."
      });
      return;
    }

    setIsGenerating(true);
    setIsExpanded(false);
    
    try {
      const artisticUrl = await generateArtisticImage(uploadedPhotoUrl, style, apiKey);
      if (artisticUrl) {
        setGeneratedArtisticUrl(artisticUrl);
        onArtisticUrlGenerated?.(artisticUrl);
        toast({
          title: "Style artistique généré !",
          description: "Votre photo a été transformée avec succès."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Échec de la génération",
          description: "Impossible de générer le style artistique. Veuillez réessayer."
        });
      }
    } catch (error) {
      console.error('Error generating artistic style:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération."
      });
    } finally {
      setIsGenerating(false);
    }
  };

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

      {/* Aperçu du style généré */}
      {selectedStyle && generatedArtisticUrl && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border-2 border-primary/30">
          <Image
            src={generatedArtisticUrl}
            alt="Version artistique générée"
            fill
            className="object-cover transition-opacity duration-500"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-white">
                {deepAIStyles.find(s => s.key === selectedStyle)?.emoji} {deepAIStyles.find(s => s.key === selectedStyle)?.label} - Généré par IA
              </span>
            </div>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 px-4 bg-muted rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Upload de la photo pour prévisualisation...
        </div>
      )}

      {!isExpanded ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(true)}
          disabled={isUploading || !uploadedPhotoUrl}
          className={cn(
            "w-full py-6 border-dashed rounded-xl transition-all",
            selectedStyle && "border-primary bg-primary/5",
            (isUploading || !uploadedPhotoUrl) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Upload en cours...</span>
            </div>
          ) : selectedStyle ? (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm">
                {deepAIStyles.find(s => s.key === selectedStyle)?.emoji} {' '}
                {deepAIStyles.find(s => s.key === selectedStyle)?.label}
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
              Génération IA en cours... (2-5 secondes)
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {deepAIStyles.map(({ key, label, emoji }) => (
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
            Les styles sont générés par IA (DeepAI) - 10 000 crédits gratuits/mois
          </p>
        </div>
      )}
    </div>
  );
}
