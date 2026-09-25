"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move,
  Maximize2
} from "lucide-react";

interface ManualFramingControlsProps {
  positionX: number;
  positionY: number;
  zoom?: number;
  onPositionChange: (x: number, y: number) => void;
  onZoomChange?: (zoom: number) => void;
  disabled?: boolean;
}

export function ManualFramingControls({
  positionX,
  positionY,
  zoom = 1.25,
  onPositionChange,
  onZoomChange,
  disabled = false,
}: ManualFramingControlsProps) {
  const step = 5;

  const moveUp = () => onPositionChange(positionX, Math.max(0, positionY - step));
  const moveDown = () => onPositionChange(positionX, Math.min(100, positionY + step));
  const moveLeft = () => onPositionChange(Math.max(0, positionX - step), positionY);
  const moveRight = () => onPositionChange(Math.min(100, positionX + step), positionY);
  const resetCenter = () => {
    onPositionChange(50, 50);
    if (onZoomChange) onZoomChange(1.25);
  };

  const currentZoomPercent = Math.round(zoom * 100);

  return (
    <div className="mt-3 bg-slate-50 dark:bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
      {/* Header with live coords */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Move className="h-3.5 w-3.5 text-primary" />
          <Label className="text-xs uppercase font-bold text-slate-700 dark:text-slate-300">
            Ajustement Manuel 2D
          </Label>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono font-semibold text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border shadow-2xs">
          <span>X: {Math.round(positionX)}%</span>
          <span>•</span>
          <span>Y: {Math.round(positionY)}%</span>
          <span>•</span>
          <span>Zoom: {currentZoomPercent}%</span>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 italic">
        Glissez la photo directement avec votre doigt ou la souris dans tous les sens (haut, bas, gauche, droite) ou utilisez les commandes ci-dessous.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Directional Pad */}
        <div className="flex flex-col items-center justify-center p-2 bg-white dark:bg-slate-800 rounded-lg border shadow-2xs space-y-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-primary/10"
            onClick={moveUp}
            disabled={disabled}
            title="Déplacer vers le haut"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-primary/10"
              onClick={moveLeft}
              disabled={disabled}
              title="Déplacer vers la gauche"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-primary hover:bg-primary/15 font-bold"
              onClick={resetCenter}
              disabled={disabled}
              title="Recentrer à 50%, 50%"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-primary/10"
              onClick={moveRight}
              disabled={disabled}
              title="Déplacer vers la droite"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg hover:bg-primary/10"
            onClick={moveDown}
            disabled={disabled}
            title="Déplacer vers le bas"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom & Quick Framing */}
        <div className="flex flex-col justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border shadow-2xs space-y-2">
          {onZoomChange && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Maximize2 className="h-3 w-3" /> Échelle / Zoom
                </span>
                <span className="font-mono text-[11px] font-bold text-primary">
                  {zoom.toFixed(2)}x
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => onZoomChange(Math.max(1, Number((zoom - 0.1).toFixed(2))))}
                  disabled={disabled || zoom <= 1}
                  title="Dézoomer"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Slider
                  value={[zoom]}
                  min={1}
                  max={2.5}
                  step={0.05}
                  onValueChange={(val) => onZoomChange(val[0])}
                  disabled={disabled}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => onZoomChange(Math.min(2.5, Number((zoom + 0.1).toFixed(2))))}
                  disabled={disabled || zoom >= 2.5}
                  title="Zoomer"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Raccourcis:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 py-0"
              onClick={() => onPositionChange(50, 15)}
              disabled={disabled}
            >
              Haut
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 py-0"
              onClick={() => onPositionChange(50, 50)}
              disabled={disabled}
            >
              Centre
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 py-0"
              onClick={() => onPositionChange(50, 85)}
              disabled={disabled}
            >
              Bas
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
