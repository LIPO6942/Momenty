"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ImageLightboxProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  children?: React.ReactNode;
}

export function ImageLightbox({
  src,
  alt,
  width,
  height,
  className,
  children
}: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

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
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
          />
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

            {/* Image agrandie */}
            <div className="relative w-full h-[90vh] flex items-center justify-center p-8">
              <Image
                src={src}
                alt={alt}
                fill
                className="object-contain"
                quality={100}
                priority
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
