"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { clTransform, buildTransformFromDisplay } from "@/lib/cloudinary";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { ParallaxContainer } from "@/components/ui/parallax-container";
import type { DisplayTransform, CollageTemplate, PhotoFilter } from "@/lib/types";
import { getTemplateById } from "@/lib/collage-templates";
import { LayoutGrid, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPatternStyle } from "./collage-canvas";

// Helper: read ken burns flag from localStorage safely
const isKenBurnsEnabled = () => {
    try {
        if (typeof window === 'undefined') return false;
        const raw = window.localStorage.getItem('momenty:kenBurnsEnabled');
        return raw === '1' || raw === 'true';
    } catch (e) {
        return false;
    }
}

// Small toggle used in the collage UI — dispatches a custom event so other parts update
const KenBurnsToggle = () => {
    const [on, setOn] = React.useState(isKenBurnsEnabled());

    React.useEffect(() => {
        const handler = () => setOn(isKenBurnsEnabled());
        window.addEventListener('storage', handler);
        window.addEventListener('momenty:kenBurnsChanged', handler as EventListener);
        return () => {
            window.removeEventListener('storage', handler);
            window.removeEventListener('momenty:kenBurnsChanged', handler as EventListener);
        };
    }, []);

    const toggle = () => {
        const next = !isKenBurnsEnabled();
        try {
            window.localStorage.setItem('momenty:kenBurnsEnabled', next ? '1' : '0');
        } catch (e) {
            console.error('Failed to write kenBurns flag', e);
        }
        // notify others
        try { window.dispatchEvent(new Event('momenty:kenBurnsChanged')); } catch {}
        setOn(next);
    }

    return (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggle(); }}
            aria-pressed={on}
            className={cn(
                "h-8 w-8 rounded-md flex items-center justify-center text-white transition-colors duration-150",
                on ? 'bg-primary ring-2 ring-primary/50 shadow-md' : 'bg-black/40 backdrop-blur-sm hover:bg-black/60'
            )}
            title={on ? 'Désactiver Ken Burns' : 'Activer Ken Burns'}
        >
            <Maximize2 className={cn('h-4 w-4', on ? 'text-white' : 'text-white/90')} />
        </button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLAGE RENDERER — reconstructs from CollageTemplate JSON
// ─────────────────────────────────────────────────────────────────────────────

interface CollageRendererProps {
    collageTemplate: CollageTemplate;
    title: string;
    audioUrl?: string | null;
    interactive?: boolean;
    photoFilter?: PhotoFilter;
}

const RATIO_PADDING: Record<string, string> = {
    '1:1':     'pb-[100%]',      // Carré
    '4:5':     'pb-[125%]',      // Instagram portrait
    '16:9':    'pb-[56.25%]',    // Paysage HD
    '9:16':    'pb-[177.78%]',   // Stories
    '2:3':     'pb-[150%]',      // Portrait
    '3:2':     'pb-[66.67%]',    // Paysage photo
    '3:4':     'pb-[133.33%]',   // Portrait classique
    '21:9':    'pb-[42.86%]',    // Cinéma
    '1:1.414': 'pb-[141.4%]',    // A4
};

export const CollageRenderer = ({
    collageTemplate,
    title,
    audioUrl,
    interactive = true,
    photoFilter,
}: CollageRendererProps) => {
    const def = getTemplateById(collageTemplate.templateId);
    if (!def) return null;

    const [kenBurnsEnabled, setKenBurnsEnabled] = React.useState(() => isKenBurnsEnabled());
    React.useEffect(() => {
        const handler = () => setKenBurnsEnabled(isKenBurnsEnabled());
        window.addEventListener('momenty:kenBurnsChanged', handler as EventListener);
        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener('momenty:kenBurnsChanged', handler as EventListener);
            window.removeEventListener('storage', handler);
        };
    }, []);

    const { gap, borderRadius, bgColor, slots, ratio = '1:1', bgPattern, photoFrame, photoTilt } = collageTemplate;

    const allPhotos = slots
        .sort((a, b) => a.slotIndex - b.slotIndex)
        .map(s => s.photoUrl)
        .filter(Boolean);

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: def.gridTemplateColumns,
        gridTemplateRows: def.gridTemplateRows,
        gap: `${gap}px`,
        ...getPatternStyle(bgPattern, bgColor),
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
    };

    return (
        <div className={cn("relative w-full", RATIO_PADDING[ratio] ?? 'pb-[100%]')}>
            {/* Ken Burns toggle (visible on timeline) - stateful */}
            <div className="absolute bottom-2 left-2 z-50 pointer-events-auto">
                <KenBurnsToggle />
            </div>
            {/* Collage grid icon overlay */}
            <div className="absolute top-2 left-2 z-20 bg-black/40 backdrop-blur-sm rounded-md p-1" title="Collage">
                <LayoutGrid className="h-3 w-3 text-white/80" />
            </div>

            <div style={gridStyle}>
                {def.slots.map(slotDef => {
                    const slotData = slots.find(s => s.slotIndex === slotDef.slotIndex);
                    const photoUrl = slotData?.photoUrl;

                    if (!photoUrl) return null;

                    const tilt = photoTilt && photoUrl ? (slotDef.slotIndex % 2 === 0 ? '-2deg' : '2deg') : '0deg';
                    let frameStyle: React.CSSProperties = {};
                    if (photoFrame === 'polaroid' && photoUrl) {
                        // Style Polaroid : marges blanches, ombre portée
                        frameStyle = { padding: '8px 8px 30px 8px', backgroundColor: '#fff', boxShadow: '0 4px 15px -2px rgba(0,0,0,0.2), 0 2px 6px -1px rgba(0,0,0,0.1)' };
                    } else if (photoFrame === 'classic' && photoUrl) {
                        // Style Classique : cadre simple
                        frameStyle = { padding: '6px', backgroundColor: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
                    } else if (photoFrame === 'clean' && photoUrl) {
                        // Style Clean : sans espacement, bordures fines
                        frameStyle = { border: '1px solid rgba(255,255,255,0.3)' };
                    } else if (photoFrame === 'mosaic' && photoUrl) {
                        // Style Mosaic : ombre subtile pour effet 3D
                        frameStyle = { boxShadow: '0 2px 8px rgba(0,0,0,0.15)' };
                    } else if (photoFrame === 'minimal' && photoUrl) {
                        // Style Minimal : espacement égal, coins légers
                        frameStyle = { border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
                    }

                    const photo = (
                        <div
                            key={slotDef.slotIndex}
                            style={{
                                gridColumn: slotDef.gridColumn,
                                gridRow: slotDef.gridRow,
                                borderRadius: `${borderRadius}px`,
                                overflow: 'hidden',
                                position: 'relative',
                                transform: `rotate(${tilt})`,
                                ...frameStyle
                            }}
                        >
                            {interactive ? (
                                <ImageLightbox
                                    src={photoUrl}
                                    photos={allPhotos}
                                    audioUrl={audioUrl}
                                    initialIndex={slotDef.slotIndex}
                                    showAudioIcon={slotDef.slotIndex === 0}
                                    alt={`${title} — photo ${slotDef.slotIndex + 1}`}
                                    width={800}
                                    height={800}
                                    filteredUrl={slotDef.slotIndex === 0 && photoFilter ? photoFilter.filteredUrl : undefined}
                                >
                                    <ParallaxContainer speed={0.03} active={interactive && kenBurnsEnabled} className="w-full h-full">
                                        <Image
                                            src={photoUrl}
                                            alt={`${title} ${slotDef.slotIndex + 1}`}
                                            fill
                                            className="object-cover w-full h-full"
                                            sizes="(max-width: 640px) 50vw, 400px"
                                        />
                                    </ParallaxContainer>
                                </ImageLightbox>
                            ) : (
                                <Image
                                    src={photoUrl}
                                    alt={`${title} ${slotDef.slotIndex + 1}`}
                                    fill
                                    className="object-cover w-full h-full"
                                    sizes="(max-width: 640px) 50vw, 400px"
                                />
                            )}
                        </div>
                    );

                    return photo;
                })}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY PHOTO COLLAGE — original layout logic (backward compatible)
// ─────────────────────────────────────────────────────────────────────────────

export const PhotoCollage = ({
    photos,
    title,
    displayTransform,
    audioUrl,
    interactive = true,
    onPositionChange,
    collageTemplate,
    photoFilter,
}: {
    photos: string[],
    title: string,
    displayTransform?: DisplayTransform,
    audioUrl?: string | null,
    interactive?: boolean,
    onPositionChange?: (index: number, x: number, y: number) => void,
    collageTemplate?: CollageTemplate,
    photoFilter?: PhotoFilter,
}) => {
    // ── If a collage template is present, use the new renderer ───────────────
    if (collageTemplate && collageTemplate.slots.length > 0) {
        return (
            <div className="w-full">
                <CollageRenderer
                    collageTemplate={collageTemplate}
                    title={title}
                    audioUrl={audioUrl}
                    interactive={interactive}
                    photoFilter={photoFilter}
                />
            </div>
        );
    }

    // ── Legacy rendering ─────────────────────────────────────────────────────
    const photoCount = photos.length;
    const t = buildTransformFromDisplay(displayTransform);

    // Drag state for manual positioning
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
    
    // Ken Burns toggle state
    const [kenBurnsEnabled, setKenBurnsEnabled] = React.useState(() => {
        if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('momenty:kenBurnsEnabled');
            return raw === '1' || raw === 'true';
        }
        return false;
    });

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

        const deltaX = (clientX - dragStart.x) / 5;
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

        const objectPosition = (displayTransform?.gravity === 'custom')
            ? `${displayTransform.positionX ?? 50}% ${displayTransform.positionY ?? 50}%`
            : undefined;

        const content = (
            <ParallaxContainer speed={0.02 * (index + 1)} className="w-full h-full" active={interactive && kenBurnsEnabled}>
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
                filteredUrl={index === 0 && photoFilter ? photoFilter.filteredUrl : undefined}
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
                        {renderPhoto(clTransform(photos[0], { w: t.w, h: t.h, c: t.c, g: t.g }), 0, "max-h-[600px] sm:max-h-[70vh] md:h-[450px]", t.w, t.h, true)}
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

    return (
        <div className="w-full relative">
            {renderGrid()}
            <div className="absolute bottom-2 left-2 z-50 pointer-events-auto">
                <KenBurnsToggle />
            </div>
        </div>
    );
}
