"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InteractiveImageFrameProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  positionX: number; // 0 to 100
  positionY: number; // 0 to 100
  zoom: number;      // 1.0 to 2.5
  onFramingChange: (framing: { positionX: number; positionY: number; zoom: number }) => void;
  badgeLabel?: string;
  showControls?: boolean;
  topRightActions?: React.ReactNode;
  disabled?: boolean;
}

export function InteractiveImageFrame({
  src,
  alt = "Photo",
  width = 800,
  height = 800,
  className,
  containerClassName,
  positionX,
  positionY,
  zoom,
  onFramingChange,
  badgeLabel,
  showControls = true,
  topRightActions,
  disabled = false,
}: InteractiveImageFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchDistanceRef = useRef<number | null>(null);

  // Normalized safe values
  const currentX = typeof positionX === 'number' && !isNaN(positionX) ? positionX : 50;
  const currentY = typeof positionY === 'number' && !isNaN(positionY) ? positionY : 50;
  const currentZoom = typeof zoom === 'number' && !isNaN(zoom) && zoom >= 1 ? zoom : 1.25;

  // Zoom handlers
  const handleZoomChange = useCallback((newZoom: number) => {
    const clamped = Math.max(1.0, Math.min(2.5, Math.round(newZoom * 100) / 100));
    onFramingChange({
      positionX: currentX,
      positionY: currentY,
      zoom: clamped,
    });
  }, [currentX, currentY, onFramingChange]);

  const handleReset = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    onFramingChange({
      positionX: 50,
      positionY: 50,
      zoom: 1.25,
    });
  }, [onFramingChange]);

  // Mouse / Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    handleZoomChange(currentZoom + delta);
  };

  // Pointer / Touch Handlers for Drag and Pinch
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    // Don't drag if clicking buttons inside
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return;
    if ((e.target as HTMLElement).closest('button')) return;

    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      pinchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      // Start pinch
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchDistanceRef.current = Math.hypot(dx, dy);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || disabled) return;
      const deltaX = (e.clientX - dragStartRef.current.x) / 4;
      const deltaY = (e.clientY - dragStartRef.current.y) / 4;

      const newX = Math.max(0, Math.min(100, Math.round((currentX - deltaX) * 10) / 10));
      const newY = Math.max(0, Math.min(100, Math.round((currentY - deltaY) * 10) / 10));

      onFramingChange({
        positionX: newX,
        positionY: newY,
        zoom: currentZoom,
      });

      dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (disabled) return;

      if (e.touches.length === 1 && isDragging) {
        const deltaX = (e.touches[0].clientX - dragStartRef.current.x) / 4;
        const deltaY = (e.touches[0].clientY - dragStartRef.current.y) / 4;

        const newX = Math.max(0, Math.min(100, Math.round((currentX - deltaX) * 10) / 10));
        const newY = Math.max(0, Math.min(100, Math.round((currentY - deltaY) * 10) / 10));

        onFramingChange({
          positionX: newX,
          positionY: newY,
          zoom: currentZoom,
        });

        dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && pinchDistanceRef.current !== null) {
        // Pinching to zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const diff = dist - pinchDistanceRef.current;

        if (Math.abs(diff) > 5) {
          const delta = diff > 0 ? 0.04 : -0.04;
          handleZoomChange(currentZoom + delta);
          pinchDistanceRef.current = dist;
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      pinchDistanceRef.current = null;
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      pinchDistanceRef.current = null;
    };

    if (isDragging || pinchDistanceRef.current !== null) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
      window.addEventListener("touchcancel", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isDragging, disabled, currentX, currentY, currentZoom, onFramingChange, handleZoomChange]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={cn(
        "relative overflow-hidden w-full h-full select-none cursor-move group touch-none rounded-xl bg-slate-900/10",
        isDragging && "cursor-grabbing",
        containerClassName
      )}
      style={{ touchAction: "none" }}
    >
      {/* The Framed & Zoomed Image */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        draggable={false}
        className={cn(
          "w-full h-full object-cover transition-none pointer-events-none select-none",
          className
        )}
        style={{
          objectPosition: `${currentX}% ${currentY}%`,
          transform: currentZoom > 1 ? `scale(${currentZoom})` : undefined,
          transformOrigin: `${currentX}% ${currentY}%`,
        }}
      />

      {/* Badge label (Photo 1, Photo 2, etc.) */}
      {badgeLabel && (
        <span className="absolute top-2 left-2 z-20 text-[10px] font-black uppercase tracking-wider bg-black/70 text-white px-2 py-0.5 rounded-md backdrop-blur-md shadow-xs pointer-events-none border border-white/10">
          {badgeLabel}
        </span>
      )}

      {/* Top right actions slot (e.g. AI analyze, delete button) */}
      {topRightActions && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 pointer-events-auto">
          {topRightActions}
        </div>
      )}

      {/* Floating On-Photo Zoom Pill Controls */}
      {showControls && (
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/75 backdrop-blur-md px-1.5 py-1 rounded-full text-white shadow-lg border border-white/20 pointer-events-auto">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleZoomChange(currentZoom - 0.1);
            }}
            disabled={disabled || currentZoom <= 1.0}
            className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 disabled:opacity-30 transition-all text-white"
            title="Dézoomer"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>

          <span className="text-[11px] font-mono font-bold px-1 min-w-[34px] text-center select-none text-white/95">
            {currentZoom.toFixed(1)}x
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              handleZoomChange(currentZoom + 0.1);
            }}
            disabled={disabled || currentZoom >= 2.5}
            className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 disabled:opacity-30 transition-all text-white"
            title="Zoomer"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          <div className="w-[1px] h-3.5 bg-white/25 mx-0.5" />

          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all text-amber-300"
            title="Recentrer (50%, 50%)"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Visual hint on desktop hover */}
      <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
        <span className="text-[10px] bg-black/60 text-white/80 px-2 py-0.5 rounded-md backdrop-blur-xs font-medium border border-white/10">
          Glissez pour cadrer • Molette pour zoomer
        </span>
      </div>
    </div>
  );
}
