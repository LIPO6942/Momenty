"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { X, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollageTemplateDef } from "@/lib/collage-templates";

interface CollageCanvasProps {
    template: CollageTemplateDef;
    photoUrls: string[];           // Ordered list of selected photos (data URLs or remote)
    slotAssignment: (string | null)[]; // slotAssignment[slotIndex] = photoUrl or null
    onSlotAssignmentChange: (newAssignment: (string | null)[]) => void;
    gap: number;
    borderRadius: number;
    bgColor: string;
    ratio: '1:1' | '4:5' | '16:9';
    bgPattern?: string;
    photoFrame?: 'none' | 'polaroid' | 'classic';
    photoTilt?: boolean;
}

const RATIO_PADDING: Record<string, string> = {
    '1:1':  'pb-[100%]',
    '4:5':  'pb-[125%]',
    '16:9': 'pb-[56.25%]',
};

// Helper for patterns
export function getPatternStyle(pattern?: string, color: string = '#000000'): React.CSSProperties {
    if (!pattern || pattern === 'none') return { backgroundColor: color };
    
    // For patterns, it's often nicer to overlay on top of the bgColor, but we can do simple backgrounds:
    switch (pattern) {
        case 'dots':
            return {
                backgroundColor: color,
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 2px, transparent 2px)',
                backgroundSize: '20px 20px'
            };
        case 'grid':
            return {
                backgroundColor: color,
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            };
        case 'diagonal':
            return {
                backgroundColor: color,
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 8px)'
            };
        default:
            return { backgroundColor: color };
    }
}

export function CollageCanvas({
    template,
    photoUrls,
    slotAssignment,
    onSlotAssignmentChange,
    gap,
    borderRadius,
    bgColor,
    ratio,
    bgPattern,
    photoFrame,
    photoTilt,
}: CollageCanvasProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [targetSlot, setTargetSlot] = useState<number | null>(null);
    const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);
    const [draggingFromSlot, setDraggingFromSlot] = useState<number | null>(null);

    // ── File picker triggered by tapping an empty slot ──────────────────────
    const openFilePicker = (slotIndex: number) => {
        setTargetSlot(slotIndex);
        fileInputRef.current?.click();
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || targetSlot === null) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const next = [...slotAssignment];
            next[targetSlot] = dataUrl;
            onSlotAssignmentChange(next);
        };
        reader.readAsDataURL(file);

        // Reset input
        if (e.target) e.target.value = '';
        setTargetSlot(null);
    };

    // ── Tap a filled slot → cycle to next unassigned photo ──────────────────
    const handleSlotClick = (slotIndex: number) => {
        const current = slotAssignment[slotIndex];
        if (!current) {
            // Try assigning next unassigned photo
            const assigned = new Set(slotAssignment.filter(Boolean));
            const next = photoUrls.find(p => !assigned.has(p));
            if (next) {
                const updated = [...slotAssignment];
                updated[slotIndex] = next;
                onSlotAssignmentChange(updated);
            } else {
                openFilePicker(slotIndex);
            }
        }
    };

    // ── Remove photo from a slot ─────────────────────────────────────────────
    const clearSlot = (slotIndex: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = [...slotAssignment];
        updated[slotIndex] = null;
        onSlotAssignmentChange(updated);
    };

    // ── Drag & Drop handlers ─────────────────────────────────────────────────
    const handleDragStart = (e: React.DragEvent, slotIndex: number) => {
        e.dataTransfer.setData('slotIndex', String(slotIndex));
        setDraggingFromSlot(slotIndex);
    };

    const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
        e.preventDefault();
        setDragOverSlot(slotIndex);
    };

    const handleDragLeave = () => setDragOverSlot(null);

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        setDragOverSlot(null);
        const sourceIndexStr = e.dataTransfer.getData('slotIndex');
        const photoUrl = e.dataTransfer.getData('photoUrl');

        if (sourceIndexStr !== '') {
            // Swap between two slots
            const sourceIndex = parseInt(sourceIndexStr);
            if (sourceIndex === targetIndex) return;
            const updated = [...slotAssignment];
            const temp = updated[sourceIndex];
            updated[sourceIndex] = updated[targetIndex];
            updated[targetIndex] = temp;
            onSlotAssignmentChange(updated);
        } else if (photoUrl) {
            // Drop from the thumbnail strip
            const updated = [...slotAssignment];
            // If target already has a photo, swap
            const existingIdx = updated.findIndex(p => p === null);
            updated[targetIndex] = photoUrl;
            onSlotAssignmentChange(updated);
        }
        setDraggingFromSlot(null);
    };

    const handleDropFromStrip = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        setDragOverSlot(null);
        const photoUrl = e.dataTransfer.getData('photoUrl');
        if (!photoUrl) return;
        const updated = [...slotAssignment];
        // If target is occupied, swap with strip item
        updated[targetIndex] = photoUrl;
        onSlotAssignmentChange(updated);
        setDraggingFromSlot(null);
    };

    // ── Compute grid style ───────────────────────────────────────────────────
    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: template.gridTemplateColumns,
        gridTemplateRows: template.gridTemplateRows,
        gap: `${gap}px`,
        ...getPatternStyle(bgPattern, bgColor),
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
    };

    return (
        <div className="space-y-4">
            {/* Canvas with fixed aspect ratio */}
            <div className={cn("relative w-full", RATIO_PADDING[ratio])}>
                <div style={gridStyle}>
                    {template.slots.map(slot => {
                        const photo = slotAssignment[slot.slotIndex] ?? null;
                        const isDragOver = dragOverSlot === slot.slotIndex;
                        const isDraggingThis = draggingFromSlot === slot.slotIndex;
                        
                        // Fake random tilt based on slot index to be deterministic
                        const tilt = photoTilt && photo ? (slot.slotIndex % 2 === 0 ? '-2deg' : '2deg') : '0deg';
                        
                        // Frames
                        let frameStyle: React.CSSProperties = {};
                        if (photoFrame === 'polaroid' && photo) {
                            frameStyle = { padding: '8px 8px 30px 8px', backgroundColor: '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' };
                        } else if (photoFrame === 'classic' && photo) {
                            frameStyle = { padding: '6px', backgroundColor: '#fff', border: '1px solid #e2e8f0' };
                        }

                        return (
                            <div
                                key={slot.slotIndex}
                                style={{
                                    gridColumn: slot.gridColumn,
                                    gridRow: slot.gridRow,
                                    borderRadius: `${borderRadius}px`,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    cursor: photo ? 'grab' : 'pointer',
                                    transition: 'opacity 0.15s, transform 0.2s',
                                    opacity: isDraggingThis ? 0.5 : 1,
                                    transform: `rotate(${tilt}) scale(${isDragOver ? 1.05 : 1})`,
                                    ...frameStyle
                                }}
                                className={cn(
                                    "group",
                                    isDragOver && "ring-2 ring-primary ring-inset"
                                )}
                                onClick={() => !photo && handleSlotClick(slot.slotIndex)}
                                draggable={!!photo}
                                onDragStart={(e) => photo && handleDragStart(e, slot.slotIndex)}
                                onDragOver={(e) => handleDragOver(e, slot.slotIndex)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => {
                                    const src = e.dataTransfer.getData('slotIndex');
                                    if (src !== '') handleDrop(e, slot.slotIndex);
                                    else handleDropFromStrip(e, slot.slotIndex);
                                }}
                            >
                                {photo ? (
                                    <>
                                        <Image
                                            src={photo}
                                            alt={`Slot ${slot.slotIndex + 1}`}
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 640px) 50vw, 300px"
                                            // Don't apply bgColor here if we have a frame, else it breaks the frame. Or rather, object-contain already handles it.
                                            // But wait, if object-contain is used, there might be empty space.
                                        />
                                        {/* Remove button */}
                                        <button
                                            className="absolute top-1.5 right-1.5 z-10 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                            onClick={(e) => clearSlot(slot.slotIndex, e)}
                                            type="button"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                        {/* Slot number badge */}
                                        <span className="absolute bottom-1.5 left-1.5 z-10 text-[10px] font-bold bg-black/50 text-white rounded px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {slot.slotIndex + 1}
                                        </span>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200/80 hover:bg-slate-300/80 transition-colors min-h-[60px]">
                                        <ImagePlus className="h-5 w-5 text-slate-400 mb-1" />
                                        <span className="text-[10px] text-slate-500 font-medium">
                                            Slot {slot.slotIndex + 1}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Photo strip — drag photos from here to slots */}
            {photoUrls.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Vos photos — glissez vers les slots
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {photoUrls.map((url, i) => {
                            const isAssigned = slotAssignment.includes(url);
                            return (
                                <div
                                    key={i}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('photoUrl', url);
                                    }}
                                    className={cn(
                                        "flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden relative cursor-grab border-2 transition-all",
                                        isAssigned
                                            ? "border-primary opacity-50"
                                            : "border-transparent hover:border-primary/50"
                                    )}
                                    title={isAssigned ? "Déjà placée" : "Glisser dans un slot"}
                                >
                                    <Image
                                        src={url}
                                        alt={`Photo ${i + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="56px"
                                    />
                                    {isAssigned && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <span className="text-white text-xs font-bold">✓</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={handleFileSelected}
            />
        </div>
    );
}
