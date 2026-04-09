"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { CollageTemplate } from "@/lib/types";

interface CollageCustomizerProps {
    settings: Pick<CollageTemplate, 'gap' | 'borderRadius' | 'bgColor' | 'ratio' | 'bgPattern' | 'photoFrame' | 'photoTilt'>;
    onChange: (updated: Pick<CollageTemplate, 'gap' | 'borderRadius' | 'bgColor' | 'ratio' | 'bgPattern' | 'photoFrame' | 'photoTilt'>) => void;
}

const RATIOS: CollageTemplate['ratio'][] = ['1:1', '4:5', '16:9'];
const PATTERNS = [
    { id: 'none', label: 'Aucun' },
    { id: 'dots', label: 'Pois' },
    { id: 'grid', label: 'Grille' },
    { id: 'diagonal', label: 'Lignes' },
];
const FRAMES = [
    { id: 'none', label: 'Normal' },
    { id: 'polaroid', label: 'Polaroid' },
    { id: 'classic', label: 'Cadre' },
];

const PRESET_COLORS = [
    '#000000', '#ffffff', '#1e293b', '#334155',
    '#7c3aed', '#2563eb', '#16a34a', '#dc2626',
    '#ea580c', '#d97706',
];

export function CollageCustomizer({ settings, onChange }: CollageCustomizerProps) {
    const update = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
        onChange({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-5 pt-1">
            {/* Ratio */}
            <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50">
                    Format du collage
                </Label>
                <div className="flex gap-2">
                    {RATIOS.map(r => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => update('ratio', r)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                                settings.ratio === r
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-slate-200 text-muted-foreground hover:border-slate-400'
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Gap */}
            <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50 flex justify-between">
                    <span>Espacement : {settings.gap}px</span>
                </Label>
                <div className="flex gap-2">
                    {[0, 2, 4, 8, 12].map(g => (
                        <button
                            key={g}
                            type="button"
                            onClick={() => update('gap', g)}
                            className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md border transition-all ${
                                settings.gap === g
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-slate-200 text-muted-foreground hover:border-slate-400'
                            }`}
                        >
                            {g === 0 ? 'Sans' : g}
                        </button>
                    ))}
                </div>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50 flex justify-between">
                    <span>Coins arrondis : {settings.borderRadius}px</span>
                </Label>
                <div className="flex gap-2">
                    {[0, 4, 8, 16, 24].map(r => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => update('borderRadius', r)}
                            className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md border transition-all ${
                                settings.borderRadius === r
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-slate-200 text-muted-foreground hover:border-slate-400'
                            }`}
                        >
                            {r === 0 ? 'Carré' : r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Background Color */}
            <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50">
                    Couleur de fond
                </Label>
                <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => update('bgColor', color)}
                            className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                            style={{
                                backgroundColor: color,
                                borderColor: settings.bgColor === color ? 'hsl(var(--primary))' : '#e2e8f0',
                                boxShadow: settings.bgColor === color ? '0 0 0 2px hsl(var(--primary)/0.3)' : undefined,
                            }}
                            title={color}
                        />
                    ))}
                    {/* Custom color picker */}
                    <label className="w-7 h-7 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-primary transition-colors" title="Couleur personnalisée">
                        <span className="text-[10px] text-slate-400">+</span>
                        <input
                            type="color"
                            value={settings.bgColor}
                            onChange={e => update('bgColor', e.target.value)}
                            className="sr-only"
                        />
                    </label>
                </div>
            </div>

            {/* Background Pattern */}
            <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50">
                    Motif de fond
                </Label>
                <div className="flex gap-2 flex-wrap">
                    {PATTERNS.map(pattern => (
                        <button
                            key={pattern.id}
                            type="button"
                            onClick={() => update('bgPattern', pattern.id as any)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md border-2 transition-all ${
                                (settings.bgPattern || 'none') === pattern.id
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-slate-200 text-muted-foreground hover:border-slate-400'
                            }`}
                        >
                            {pattern.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Photo Frame */}
            <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50">
                    Style des cadres
                </Label>
                <div className="flex gap-2 flex-wrap">
                    {FRAMES.map(frame => (
                        <button
                            key={frame.id}
                            type="button"
                            onClick={() => update('photoFrame', frame.id as any)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-lg border-2 transition-all ${
                                (settings.photoFrame || 'none') === frame.id
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-slate-200 text-muted-foreground hover:border-slate-400'
                            }`}
                        >
                            {frame.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Photo Tilt */}
            <div className="space-y-2">
                <Label className="flex items-center justify-between cursor-pointer border p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-semibold">Incliner les photos</span>
                    <input
                        type="checkbox"
                        checked={!!settings.photoTilt}
                        onChange={(e) => update('photoTilt', e.target.checked)}
                        className="rounded border-slate-300 text-primary focus:ring-primary w-5 h-5 accent-primary"
                    />
                </Label>
            </div>
        </div>
    );
}
