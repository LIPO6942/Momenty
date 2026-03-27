"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { clTransform, buildTransformFromDisplay } from "@/lib/cloudinary";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { ParallaxContainer } from "@/components/ui/parallax-container";
import type { DisplayTransform } from "@/lib/types";

export const PhotoCollage = ({ 
    photos, 
    title, 
    displayTransform, 
    audioUrl,
    interactive = true,
    onPositionChange
}: { 
    photos: string[], 
    title: string, 
    displayTransform?: DisplayTransform, 
    audioUrl?: string | null,
    interactive?: boolean,
    onPositionChange?: (index: number, x: number, y: number) => void
}) => {
    const photoCount = photos.length;
    const t = buildTransformFromDisplay(displayTransform);
    
    // Drag state for manual positioning
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, index: number) => {
        if (interactive || !onPositionChange) return;
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setDragStart({ x: clientX, y: clientY });
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging || !onPositionChange) return;
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        
        const deltaX = (clientX - dragStart.x) / 5; // Sensitivity
        const deltaY = (clientY - dragStart.y) / 5;
        
        const newX = Math.max(0, Math.min(100, (displayTransform?.positionX ?? 50) - deltaX));
        const newY = Math.max(0, Math.min(100, (displayTransform?.positionY ?? 50) - deltaY));
        
        onPositionChange(0, newX, newY);
        setDragStart({ x: clientX, y: clientY });
    };

    const handleMouseUp = () => setIsDragging(false);

    React.useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging, dragStart]);

    const renderPhoto = (src: string, index: number, className: string, width: number, height: number, showAudio: boolean = false) => {
        const objectClass = t.c === 'fit' ? "object-contain" : "object-cover";
        
        // Manual position logic
        const objectPosition = (displayTransform?.gravity === 'custom') 
            ? `${displayTransform.positionX ?? 50}% ${displayTransform.positionY ?? 50}%` 
            : undefined;

        const content = (
            <ParallaxContainer speed={0.02 * (index + 1)} className="w-full h-full" active={interactive}>
                <Image
                    src={src}
                    alt={`${title} ${index + 1}`}
                    width={width}
                    height={height}
                    className={cn(
                        "w-full h-full transition-none", 
                        objectClass, 
                        className,
                        !interactive && "cursor-move touch-none"
                    )}
                    style={{ objectPosition }}
                    onMouseDown={(e) => handleMouseDown(e, index)}
                    onTouchStart={(e) => handleMouseDown(e, index)}
                />
            </ParallaxContainer>
        );

        if (!interactive) return content;

        return (
            <ImageLightbox
                src={src}
                photos={photos.map(p => clTransform(p, { w: 1200, h: 1200, c: "fit" }))}
                audioUrl={audioUrl}
                initialIndex={index}
                showAudioIcon={showAudio}
                alt={`${title} ${index + 1}`}
                width={width}
                height={height}
            >
                {content}
            </ImageLightbox>
        );
    };

    const renderGrid = () => {
        switch (photoCount) {
            case 1:
                return (
                    <div className="max-h-[600px] sm:max-h-[70vh] w-full flex items-center justify-center bg-black/5 overflow-hidden">
                        {renderPhoto(clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g }), 0, "max-h-[600px] sm:max-h-[70vh] md:h-[450px]", t.w, t.h)}
                    </div>
                );
            case 2:
                return (
                    <div className="grid grid-cols-2 gap-1 h-[450px] w-full bg-black/5 overflow-hidden">
                        {photos.map((photo, index) => (
                            <div key={index}>
                                {renderPhoto(clTransform(photo, { w: t.w, h: t.h, c: t.c, g: t.g }), index, index === 0 ? "rounded-tl-xl" : "rounded-tr-xl", t.w, t.h, index === 0)}
                            </div>
                        ))}
                    </div>
                );
            case 3:
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-[450px] w-full bg-black/5 overflow-hidden">
                        <div className="col-span-1 row-span-2">
                            {renderPhoto(clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g }), 0, "rounded-tl-xl", t.w, t.h, true)}
                        </div>
                        <div className="col-span-1 row-span-1">
                            {renderPhoto(clTransform(photos[1], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g }), 1, "rounded-tr-xl", t.w, Math.round(t.h * 0.66), false)}
                        </div>
                        <div className="col-span-1 row-span-1">
                            {renderPhoto(clTransform(photos[2], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g }), 2, "", t.w, Math.round(t.h * 0.66), false)}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-[450px] w-full bg-black/5 overflow-hidden">
                        {photos.map((photo, index) => (
                            <div key={index}>
                                {renderPhoto(clTransform(photo, { w: t.w, h: t.h, c: t.c, g: t.g }), index, cn(index === 0 && "rounded-tl-xl", index === 1 && "rounded-tr-xl"), t.w, t.h, index === 0)}
                            </div>
                        ))}
                    </div>
                );
            default: // 5+ photos
                return (
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-[450px] w-full bg-black/5 overflow-hidden relative">
                        <div className="col-span-1 row-span-2">
                            {renderPhoto(clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g }), 0, "rounded-tl-xl", t.w, t.h, true)}
                        </div>
                        <div className="col-span-1 row-span-1 relative">
                            {renderPhoto(clTransform(photos[1], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g }), 1, "rounded-tr-xl", t.w, Math.round(t.h * 0.66), false)}
                        </div>
                        <div className="col-span-1 row-span-1 relative">
                            {renderPhoto(clTransform(photos[2], { w: t.w, h: Math.round(t.h * 0.66), c: t.c, g: t.g }), 2, "", t.w, Math.round(t.h * 0.66), false)}
                            {photos.length > 3 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none z-20">
                                    <span className="text-white text-2xl font-bold">+{photos.length - 3}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return <div className="w-full">{renderGrid()}</div>
}
