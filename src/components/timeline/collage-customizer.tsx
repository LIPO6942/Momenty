"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { CollageTemplate } from "@/lib/types";
import { LayoutGrid, Sparkles, Image as ImageIcon } from "lucide-react";

interface CollageCustomizerProps {
    settings: Pick<CollageTemplate, 'gap' | 'borderRadius' | 'bgColor' | 'ratio' | 'bgPattern' | 'photoFrame' | 'photoTilt' | 'layoutStyle'>;
    onChange: (updated: Pick<CollageTemplate, 'gap' | 'borderRadius' | 'bgColor' | 'ratio' | 'bgPattern' | 'photoFrame' | 'photoTilt' | 'layoutStyle'>) => void;
}

// Tous les ratios réseaux sociaux
const RATIOS: { value: CollageTemplate['ratio']; label: string; icon: string; category: string }[] = [
    // Stories & Portrait
    { value: '9:16', label: 'Stories', icon: '▯', category: 'Social' },
    { value: '4:5', label: 'Insta', icon: '▯', category: 'Social' },
    { value: '2:3', label: 'Portrait', icon: '▯', category: 'Portrait' },
    { value: '3:4', label: 'Classic', icon: '▯', category: 'Portrait' },
    // Carré & Paysage
    { value: '1:1', label: 'Carré', icon: '▪', category: 'Carré' },
    { value: '16:9', label: 'HD', icon: '▭', category: 'Paysage' },
    { value: '3:2', label: 'Photo', icon: '▭', category: 'Paysage' },
    { value: '21:9', label: 'Cinéma', icon: '▭', category: 'Paysage' },
    // Print
    { value: '1:1.414', label: 'A4', icon: '▯', category: 'Print' },
];

// Styles de mise en page (remplace gap + borderRadius)
const LAYOUT_STYLES = [
    { 
        id: 'clean', 
        label: 'Clean', 
        desc: 'Sans espacement',
        gap: 0, 
        radius: 0,
        preview: 'grid-cols-2 gap-0'
    },
    { 
        id: 'minimal', 
        label: 'Minimal', 
        desc: 'Léger espacement',
        gap: 4, 
        radius: 8,
        preview: 'grid-cols-2 gap-1'
    },
    { 
        id: 'polaroid', 
        label: 'Polaroid', 
        desc: 'Bordures blanches',
        gap: 8, 
        radius: 4,
        preview: 'grid-cols-2 gap-2 p-2 bg-white'
    },
    { 
        id: 'mosaic', 
        label: 'Mosaic', 
        desc: 'Tailles variées',
        gap: 2, 
        radius: 12,
        preview: 'grid-cols-3 gap-0.5'
    },
];

// Couleurs de fond
const PRESET_COLORS = [
    { color: '#ffffff', name: 'Blanc' },
    { color: '#000000', name: 'Noir' },
    { color: '#f8fafc', name: 'Gris clair' },
    { color: '#1e293b', name: 'Slate' },
    { color: '#fef3c7', name: 'Crème' },
    { color: '#dbeafe', name: 'Bleu clair' },
    { color: '#fce7f3', name: 'Rose clair' },
    { color: '#dcfce7', name: 'Vert clair' },
    { color: '#7c3aed', name: 'Violet' },
    { color: '#dc2626', name: 'Rouge' },
];

export function CollageCustomizer({ settings, onChange }: CollageCustomizerProps) {
    const [activeTab, setActiveTab] = useState('smart');

    const update = <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
        onChange({ ...settings, [key]: value });
    };

    const applyLayoutStyle = (styleId: string) => {
        const style = LAYOUT_STYLES.find(s => s.id === styleId);
        if (style) {
            onChange({
                ...settings,
                photoFrame: style.id as any,
                gap: style.gap,
                borderRadius: style.radius,
            });
        }
    };

    const getCurrentStyleId = () => {
        return settings.photoFrame || 'clean';
    };

    return (
        <div className="space-y-4 pt-1">
            {/* Header avec onglets style Google Photos */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="smart" className="gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span className="text-xs">Smart</span>
                    </TabsTrigger>
                    <TabsTrigger value="format" className="gap-1.5">
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span className="text-xs">Format</span>
                    </TabsTrigger>
                    <TabsTrigger value="style" className="gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span className="text-xs">Style</span>
                    </TabsTrigger>
                </TabsList>

                {/* Onglet Smart Layouts - Mise en page automatique */}
                <TabsContent value="smart" className="space-y-3 mt-3">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-50">
                        Mise en page intelligente
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Choisissez un style et nous ajusterons automatiquement vos photos
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2">
                        {LAYOUT_STYLES.map((style) => (
                            <button
                                key={style.id}
                                type="button"
                                onClick={() => applyLayoutStyle(style.id)}
                                className={`p-3 rounded-xl border-2 transition-all text-left ${
                                    getCurrentStyleId() === style.id
                                        ? 'border-primary bg-primary/5'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className={`grid ${style.preview} h-12 mb-2 rounded bg-slate-100`}>
                                    <div className="bg-slate-300 rounded-sm" />
                                    <div className="bg-slate-300 rounded-sm" />
                                </div>
                                <span className="text-xs font-semibold block">{style.label}</span>
                                <span className="text-[10px] text-muted-foreground">{style.desc}</span>
                            </button>
                        ))}
                    </div>
                </TabsContent>

                {/* Onglet Format - Tous les ratios */}
                <TabsContent value="format" className="space-y-3 mt-3">
                    <Label className="text-xs font-black uppercase tracking-widest opacity-50">
                        Format du collage
                    </Label>
                    
                    {/* Catégories */}
                    {['Social', 'Portrait', 'Carré', 'Paysage', 'Print'].map(category => {
                        const categoryRatios = RATIOS.filter(r => r.category === category);
                        if (categoryRatios.length === 0) return null;
                        
                        return (
                            <div key={category} className="space-y-2">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                    {category}
                                </span>
                                <div className="grid grid-cols-4 gap-2">
                                    {categoryRatios.map((ratio) => (
                                        <button
                                            key={ratio.value}
                                            type="button"
                                            onClick={() => update('ratio', ratio.value)}
                                            className={`py-2 px-1 text-xs font-medium rounded-lg border-2 transition-all ${
                                                settings.ratio === ratio.value
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-slate-200 text-muted-foreground hover:border-slate-300'
                                            }`}
                                        >
                                            <span className="block text-lg leading-none mb-1">{ratio.icon}</span>
                                            <span className="block scale-90">{ratio.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </TabsContent>

                {/* Onglet Style - Couleur et options */}
                <TabsContent value="style" className="space-y-4 mt-3">
                    {/* Couleur de fond */}
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest opacity-50">
                            Couleur de fond
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map(({ color, name }) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => update('bgColor', color)}
                                    className="group relative"
                                    title={name}
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl border-2 transition-all hover:scale-110"
                                        style={{
                                            backgroundColor: color,
                                            borderColor: settings.bgColor === color ? 'hsl(var(--primary))' : '#e2e8f0',
                                            boxShadow: settings.bgColor === color ? '0 0 0 3px hsl(var(--primary)/0.2)' : undefined,
                                        }}
                                    />
                                    {settings.bgColor === color && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                        </div>
                                    )}
                                </button>
                            ))}
                            {/* Color picker personnalisé */}
                            <label className="w-10 h-10 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-primary transition-colors" title="Personnalisé">
                                <span className="text-slate-400 text-lg">+</span>
                                <input
                                    type="color"
                                    value={settings.bgColor}
                                    onChange={e => update('bgColor', e.target.value)}
                                    className="sr-only"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Inclinaison */}
                    <div className="space-y-2">
                        <Label className="flex items-center justify-between cursor-pointer border p-3 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">Incliner les photos</span>
                                <span className="text-xs text-muted-foreground">Effet dynamique</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={!!settings.photoTilt}
                                onChange={(e) => update('photoTilt', e.target.checked)}
                                className="rounded border-slate-300 text-primary focus:ring-primary w-5 h-5 accent-primary"
                            />
                        </Label>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
