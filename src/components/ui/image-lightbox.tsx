"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImageLightboxProps {
  src?: string;
  photos?: string[];
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
  initialIndex = 0,
  alt,
  width,
  height,
  className,
  children
}: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  
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
          <div className="bg-white/90 rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
            <ZoomIn className="h-6 w-6 text-gray-800" />
          </div>
        </div>
      </div>

      {/* Dialog pour l'image agrandie */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none overflow-hidden">
          <VisuallyHidden>
            <DialogTitle>{alt}</DialogTitle>
          </VisuallyHidden>

          <div className="relative w-full h-full flex items-center justify-center">
            {/* Bouton de fermeture personnalisé */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Image agrandie ou Carrousel */}
            {lightboxPhotos.length > 1 ? (
              <div className="relative w-full h-[90vh] flex items-center justify-center">
                <div className="overflow-hidden w-full h-full" ref={emblaRef}>
                  <div className="flex w-full h-full">
                    {lightboxPhotos.map((photoSrc, idx) => (
                      <div key={idx} className="flex-[0_0_100%] min-w-0 relative w-full h-full flex items-center justify-center p-4 md:p-8">
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

                {/* Navigation Buttons for Carousel */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 z-50 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/50 hover:bg-black/80 text-white disabled:opacity-30"
                  onClick={scrollPrev}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 z-50 h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/50 hover:bg-black/80 text-white disabled:opacity-30"
                  onClick={scrollNext}
                  disabled={currentIndex === lightboxPhotos.length - 1}
                >
                  <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
                </Button>

                {/* Pagination indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1.5 rounded-full text-white text-sm font-medium">
                  {currentIndex + 1} / {lightboxPhotos.length}
                </div>
              </div>
            ) : (
              <div className="relative w-full h-[90vh] flex items-center justify-center p-4 md:p-8">
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
        </DialogContent>
      </Dialog>
    </>
  );
}
