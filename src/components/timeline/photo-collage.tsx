"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { clTransform, buildTransformFromDisplay } from "@/lib/cloudinary";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { ParallaxContainer } from "@/components/ui/parallax-container";
import type { DisplayTransform, CollageTemplate } from "@/lib/types";
import { getTemplateById } from "@/lib/collage-templates";
import { LayoutGrid } from "lucide-react";
import { getPatternStyle } from "./collage-canvas";

// ─────────────────────────────────────────────────────────────────────────────
// COLLAGE RENDERER — reconstructs from CollageTemplate JSON
// ─────────────────────────────────────────────────────────────────────────────

interface CollageRendererProps {
    collageTemplate: CollageTemplate;
    title: string;
    audioUrl?: string | null;
    interactive?: boolean;
}

const RATIO_PADDING: Record<string, string> = {
    '1:1':  'pb-[100%]',
    '4:5':  'pb-[125%]',
    '16:9': 'pb-[56.25%]',
};

export const CollageRenderer = ({
    collageTemplate,
    title,
    audioUrl,
    interactive = true,
}: CollageRendererProps) => {
    const def = getTemplateById(collageTemplate.templateId);
    if (!def) return null;

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
                        frameStyle = { padding: '8px 8px 30px 8px', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };
                    } else if (photoFrame === 'classic' && photoUrl) {
                        frameStyle = { padding: '6px', backgroundColor: '#fff', border: '1px solid #e2e8f0' };
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
                                >
                                    <Image
                                        src={photoUrl}
                                        alt={`${title} ${slotDef.slotIndex + 1}`}
                                        fill
                                        className="object-contain w-full h-full"
                                        sizes="(max-width: 640px) 50vw, 400px"
                                    />
                                </ImageLightbox>
                            ) : (
                                <Image
                                    src={photoUrl}
                                    alt={`${title} ${slotDef.slotIndex + 1}`}
                                    fill
                                    className="object-contain w-full h-full"
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
}: {
    photos: string[],
    title: string,
    displayTransform?: DisplayTransform,
    audioUrl?: string | null,
    interactive?: boolean,
    onPositionChange?: (index: number, x: number, y: number) => void,
    collageTemplate?: CollageTemplate,
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

    return <div className="w-full">{renderGrid()}</div>;
}
