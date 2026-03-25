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
  children
}: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Create an array of photos from either the photos array or the single src
  const lightboxPhotos = photos.length > 0 ? photos : (src ? [src] : []);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    startIndex: initialIndex,
    loop: false
  });

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", () => {
        setCurrentIndex(emblaApi.selectedScrollSnap());
      });
      // Ensure we jump to the clicked index when opening
      if (isOpen) {
        emblaApi.scrollTo(initialIndex, true);
        setCurrentIndex(initialIndex);
      }
    }
  }, [emblaApi, isOpen, initialIndex]);

  // Audio Playback Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isOpen) {
      // Small timeout to ensure browser is ready after the click that opened the dialog
      const timer = setTimeout(() => {
        audio.currentTime = 0;
        audio.play().catch(err => {
          console.error("Autoplay prevented:", err);
        });
        setIsPlaying(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isOpen, audioUrl]);

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
      <div
        className="relative group cursor-zoom-in h-full w-full"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
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

        {/* Overlay avec icône de zoom au survol */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="bg-white/90 rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300 relative">
            <ZoomIn className={cn("h-6 w-6 text-gray-800", audioUrl && "mr-1")} />
            {audioUrl && <Music className="h-3 w-3 text-primary absolute bottom-2 right-2 animate-bounce" />}
          </div>
        </div>
      </div>

      {/* Dialog pour l'image agrandie */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden sm:rounded-2xl">
          <VisuallyHidden>
            <DialogTitle>{alt}</DialogTitle>
          </VisuallyHidden>

          {/* Audio Element - Rendered inside to be near controls but handled by ref */}
          {audioUrl && (
            <audio 
              ref={audioRef} 
              src={audioUrl} 
              muted={isMuted} 
              crossOrigin="anonymous"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              loop
              className="hidden"
            />
          )}

          <div className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden">


            {/* Header Controls */}
            <div className="absolute top-4 left-4 right-4 z-[60] flex justify-between items-center pointer-events-none">
              <div className="flex gap-2 pointer-events-auto">
                {audioUrl && (
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
                            <Image
                              src={photoSrc}
                              alt={`${alt} ${idx + 1}`}
                              fill
                              className="object-contain"
                              quality={100}
                              priority={idx === currentIndex}
                            />
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
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    <Image
                      src={lightboxPhotos[0]}
                      alt={alt}
                      fill
                      className="object-contain"
                      quality={100}
                      priority
                    />
                  </div>
                )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
