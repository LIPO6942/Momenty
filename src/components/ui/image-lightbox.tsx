"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ZoomIn, ChevronLeft, ChevronRight, Volume2, VolumeX, Music, Play, Pause } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useRef } from "react";

import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  src?: string;
  photos?: string[];
  audioUrl?: string | null;
  initialIndex?: number;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  children?: React.ReactNode;
  showAudioIcon?: boolean;
  artisticUrl?: string | null; // URL de la version artistique pour animation morph
}

export function ImageLightbox({
  src,
  photos = [],
  audioUrl,
  initialIndex = 0,
  alt,
  width,
  height,
  className,
  children,
  showAudioIcon = true,
  artisticUrl
}: ImageLightboxProps) {
  // 1. ALL STATES AT THE TOP
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Magic Reveal Slider state
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isAutoSwiping, setIsAutoSwiping] = useState(false);
  const [isArtisticLoading, setIsArtisticLoading] = useState(true);
  const [artisticError, setArtisticError] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    startIndex: initialIndex,
    loop: false
  });
  
  // 2. DERIVED VALUES
  const lightboxPhotos = photos.length > 0 ? photos : (src ? [src] : []);

  // 3. EFFECTS
  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        setCurrentIndex(emblaApi.selectedScrollSnap());
      });
      if (isOpen) {
        emblaApi.scrollTo(initialIndex, true);
        setCurrentIndex(initialIndex);
      }
    }
  }, [emblaApi, isOpen, initialIndex]);

  useEffect(() => {
    const shouldShowTeaser = isOpen && artisticUrl && (lightboxPhotos.length === 1 || currentIndex === 0);
    
    if (shouldShowTeaser) {
      setSliderPosition(0);
      setIsAutoSwiping(true);
      setIsArtisticLoading(true);
      setArtisticError(false);
      
      const startTimer = setTimeout(() => {
        let pos = 0;
        const interval = setInterval(() => {
          pos += 1.5;
          if (pos >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsAutoSwiping(false); 
              setSliderPosition(50);
            }, 300);
          } else {
            setSliderPosition(pos);
          }
        }, 16);
      }, 800);
      
      return () => clearTimeout(startTimer);
    } else {
      if (lightboxPhotos.length > 1 && currentIndex !== 0) {
        setSliderPosition(50);
        setIsAutoSwiping(false);
      }
    }
  }, [isOpen, artisticUrl, lightboxPhotos.length, currentIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (!isOpen) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isOpen, audioUrl]);


  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAutoSwiping) return;
    setSliderPosition(Number(e.target.value));
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // If no image to show, don't render anything
  if (lightboxPhotos.length === 0) return <>{children}</>;

  return (
    <>
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          muted={isMuted} 
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          loop
          className="hidden"
        />
      )}
      <div
        className="relative group cursor-zoom-in h-full w-full"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
          
          if (audioUrl && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(err => {
              console.error("Autoplay prevented:", err);
            });
            setIsPlaying(true);
          }
        }}
      >
        {children || (
          src && width && height ? (
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className={className}
            />
          ) : null
        )}

        {/* Badge Mélodie Permanent */}
        {audioUrl && showAudioIcon && (
          <div className="absolute top-3 left-3 z-30 flex items-center justify-center h-6 w-6 bg-black/60 backdrop-blur-md rounded-full border border-white/20 shadow-lg pointer-events-none group-hover:bg-primary/80 transition-colors duration-300">
            <Music className="h-3 w-3 text-white animate-pulse" />
          </div>
        )}

        {/* Overlay avec icône de zoom au survol */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/90 rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300 relative">
            <ZoomIn className="h-6 w-6 text-gray-800" />
          </div>
        </div>
      </div>

      {/* Dialog pour l'image agrandie */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden sm:rounded-2xl">
          <VisuallyHidden>
            <DialogTitle>{alt}</DialogTitle>
          </VisuallyHidden>

          <div className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden">


            {/* Header Controls */}
            <div className="absolute top-4 left-4 right-4 z-[60] flex justify-between items-center pointer-events-none">
              <div className="flex gap-2 pointer-events-auto">
                {audioUrl && (
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                          "h-10 w-10 rounded-full bg-black/60 text-white backdrop-blur-sm transition-all border border-white/10 hover:bg-black/80 hover:scale-110",
                          isPlaying && "animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.5)] border-amber-400/50 text-amber-400"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isPlaying) {
                          if (audioRef.current) audioRef.current.pause();
                          setIsPlaying(false);
                        } else {
                          if (audioRef.current) {
                            audioRef.current.play().catch(err => console.error("Play failed:", err));
                          }
                          setIsPlaying(true);
                        }
                      }}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </Button>
                    <div className={cn(
                      "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 transition-all duration-500",
                      isPlaying ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
                    )}>
                      <div className="flex gap-1 justify-center items-center h-3">
                        <div className="w-1 h-3 bg-amber-400 animate-[bounce_1s_infinite_100ms] rounded-full" />
                        <div className="w-1 h-5 bg-amber-400 animate-[bounce_1s_infinite_300ms] rounded-full" />
                        <div className="w-1 h-2 bg-amber-400 animate-[bounce_1s_infinite_500ms] rounded-full" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">Studio Sonore Actif</span>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="pointer-events-auto h-10 w-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

              {/* Carousel Content */}
            <div className="relative w-full h-full flex items-center justify-center">
                {lightboxPhotos.length > 1 ? (
                  <>
                    <div className="overflow-hidden w-full h-full" ref={emblaRef}>
                      <div className="flex w-full h-full">
                        {lightboxPhotos.map((photoSrc, idx) => (
                          <div key={idx} className="flex-[0_0_100%] min-w-0 relative w-full h-full flex items-center justify-center p-4">
                            {/* IF Artistic version exists for THIS photo (index 0 based on our logic) */}
                            {idx === 0 && artisticUrl ? (
                              <div className="relative w-full h-full group/slider select-none touch-none bg-black/20">
                                {/* layer 1: Original */}
                                <div className="absolute inset-0 flex items-center justify-center z-0">
                                  <Image
                                    src={photoSrc}
                                    alt={`${alt} ${idx + 1}`}
                                    fill
                                    className="object-contain pointer-events-none"
                                    quality={100}
                                    priority={idx === currentIndex}
                                  />
                                </div>
                                
                                {/* layer 2: Artistic (Clip) */}
                                {!artisticError && (
                                  <>
                                    <div 
                                      className="absolute inset-0 flex items-center justify-center z-10"
                                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                                    >
                                      <Image
                                        src={artisticUrl}
                                        alt={`${alt} - Version artistique`}
                                        fill
                                        className={cn(
                                          "object-contain pointer-events-none transition-opacity duration-500",
                                          isArtisticLoading ? "opacity-0" : "opacity-100"
                                        )}
                                        quality={100}
                                        onLoad={() => setIsArtisticLoading(false)}
                                        onError={() => {
                                          setIsArtisticLoading(false);
                                          setArtisticError(true);
                                        }}
                                      />
                                    </div>
                                    
                                    {/* Magic Reveal Controls inside Carousel */}
                                    {idx === currentIndex && (
                                      <>
                                        <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          step="0.1"
                                          value={sliderPosition}
                                          onChange={handleSliderChange}
                                          className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-ew-resize"
                                        />
                                        <div 
                                          className={cn(
                                            "absolute top-4 bottom-4 w-[2px] bg-white/80 z-30 pointer-events-none transition-shadow",
                                            !isAutoSwiping && "group-hover/slider:shadow-[0_0_20px_rgba(255,255,255,1)] shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                                          )}
                                          style={{ left: `${sliderPosition}%` }}
                                        >
                                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-xl">
                                             <div className="flex items-center gap-0.5 scale-75">
                                               <ChevronLeft className="h-4 w-4 text-white" />
                                               <ChevronRight className="h-4 w-4 text-white" />
                                             </div>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            ) : (
                              <Image
                                src={photoSrc}
                                alt={`${alt} ${idx + 1}`}
                                fill
                                className="object-contain"
                                quality={100}
                                priority={idx === currentIndex}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 z-50 h-12 w-12 rounded-full bg-black/20 hover:bg-black/40 text-white disabled:opacity-0"
                      onClick={scrollPrev}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 z-50 h-12 w-12 rounded-full bg-black/20 hover:bg-black/40 text-white disabled:opacity-0"
                      onClick={scrollNext}
                      disabled={currentIndex === lightboxPhotos.length - 1}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 px-4 py-1.5 rounded-full text-white text-xs font-bold backdrop-blur-sm">
                      {currentIndex + 1} / {lightboxPhotos.length}
                    </div>
                  </>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center p-4 group/slider select-none touch-none bg-black/20">
                    
                    {/* layer 1: Image originale (Background - toujours pleine et visible) */}
                    <div className="absolute inset-0 flex items-center justify-center p-4 z-0">
                      <Image
                        src={lightboxPhotos[0]}
                        alt={alt}
                        fill
                        className="object-contain pointer-events-none"
                        quality={100}
                        priority
                      />
                    </div>

                    {/* layer 2: Image artistique (Top - révélée par clip-path) */}
                    {artisticUrl && !artisticError && (
                      <>
                        <div 
                          className="absolute inset-0 flex items-center justify-center p-4 z-10"
                          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                        >
                          <Image
                            src={artisticUrl}
                            alt={`${alt} - Version artistique`}
                            fill
                            className={cn(
                              "object-contain pointer-events-none transition-opacity duration-500",
                              isArtisticLoading ? "opacity-0" : "opacity-100"
                            )}
                            quality={100}
                            onLoad={() => setIsArtisticLoading(false)}
                            onError={() => {
                              setIsArtisticLoading(false);
                              setArtisticError(true);
                            }}
                          />
                        </div>
                        
                        {/* Loader pendant la génération AI */}
                        {isArtisticLoading && (
                          <div className="absolute inset-x-0 inset-y-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/60 backdrop-blur-md transition-all duration-500">
                            <div className="relative">
                              <div className="h-16 w-16 rounded-full border-t-4 border-r-4 border-white animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-10 w-10 rounded-full border-b-4 border-l-4 border-primary animate-[spin_0.8s_linear_infinite_reverse]"></div>
                              </div>
                            </div>
                            <div className="flex flex-col items-center text-center px-6">
                              <span className="text-white font-black text-base uppercase tracking-[0.3em] animate-pulse">Magie en cours...</span>
                              <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-2 bg-white/10 px-3 py-1 rounded-full border border-white/10">Transformation Turbo Activée</span>
                            </div>
                          </div>
                        )}

                      </>
                    )}
                    
                    {/* Magic Reveal Controls */}
                    {artisticUrl && (
                      <>
                        {/* Range Input invisible pour contrôle tactile/souris précis sur toute la zone */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="0.1"
                          value={sliderPosition}
                          onChange={handleSliderChange}
                          className="absolute inset-0 w-full h-full opacity-0 z-40 cursor-ew-resize"
                        />
                        
                        {/* Barre de séparation visuelle (Handle) */}
                        <div 
                          className={cn(
                            "absolute top-4 bottom-4 w-[2px] bg-white/80 z-30 pointer-events-none transition-shadow",
                            !isAutoSwiping && "group-hover/slider:shadow-[0_0_20px_rgba(255,255,255,1)] shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                          )}
                          style={{ left: `${sliderPosition}%` }}
                        >
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-xl">
                            <div className="flex items-center gap-0.5">
                              <ChevronLeft className="h-4 w-4 text-white" />
                              <ChevronRight className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          
                          {/* Etiquettes stylisées */}
                          <div className={cn(
                            "absolute top-4 -left-24 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white uppercase tracking-widest transition-opacity duration-300",
                            sliderPosition < 10 ? "opacity-0" : "opacity-100"
                          )}>
                            Artiste
                          </div>
                          <div className={cn(
                            "absolute top-4 left-6 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white uppercase tracking-widest transition-opacity duration-300 whitespace-nowrap",
                            sliderPosition > 90 ? "opacity-0" : "opacity-100"
                          )}>
                            Originale
                          </div>
                        </div>
                        
                        {/* Scan Line effect during auto-swipe (pure visual polish) */}
                        {isAutoSwiping && (
                          <div 
                            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-white/0 via-white/40 to-white/0 z-30 pointer-events-none skew-x-12"
                            style={{ left: `${sliderPosition - 15}%` }}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}

            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
