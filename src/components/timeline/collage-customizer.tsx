"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { CollageTemplate } from "@/lib/types";

interface CollageCustomizerProps {
    settings: Pick<CollageTemplate, 'gap' | 'borderRadius' | 'bgColor' | 'ratio'>;
    onChange: (updated: Pick<CollageTemplate, 'gap' | 'borderRadius' | 'bgColor' | 'ratio'>) => void;
}

const RATIOS: CollageTemplate['ratio'][] = ['1:1', '4:5', '16:9'];

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
                    <span>Espacement entre photos</span>
                    <span className="text-primary font-bold">{settings.gap}px</span>
                </Label>
                <Slider
                    min={0}
                    max={12}
                    step={1}
                    value={[settings.gap]}
                    onValueChange={([v]) => update('gap', v)}
                    className="w-full"
                />
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest opacity-50 flex justify-between">
                    <span>Coins arrondis</span>
                    <span className="text-primary font-bold">{settings.borderRadius}px</span>
                </Label>
                <Slider
                    min={0}
                    max={20}
                    step={1}
                    value={[settings.borderRadius]}
                    onValueChange={([v]) => update('borderRadius', v)}
                    className="w-full"
                />
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
        </div>
    );
}
