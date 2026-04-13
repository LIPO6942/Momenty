import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export type DescriptionStyle = 'classique-italique' | 'magazine-bold' | 'polaroid-marker' | 'cinematique';

interface DescriptionStylePickerProps {
    value: DescriptionStyle | undefined;
    onChange: (style: DescriptionStyle) => void;
}

const styles: { id: DescriptionStyle; label: string; previewClass: string; demoTextClass: string }[] = [
    { 
        id: 'classique-italique', 
        label: 'Classique', 
        previewClass: 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30',
        demoTextClass: 'text-white text-sm italic font-serif drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
    },
    { 
        id: 'magazine-bold', 
        label: 'Magazine', 
        previewClass: 'bg-gradient-to-br from-rose-500/30 to-red-500/30',
        demoTextClass: 'text-white text-[10px] font-black uppercase tracking-widest bg-black/80 px-2 py-0.5'
    },
    { 
        id: 'polaroid-marker', 
        label: 'Polaroïd', 
        previewClass: 'bg-slate-200/50',
        demoTextClass: 'text-slate-900 text-sm font-medium -rotate-2 bg-white/95 px-3 mb-1 shadow-sm'
    },
    { 
        id: 'cinematique', 
        label: 'Cinéma', 
        previewClass: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20',
        demoTextClass: 'text-[#FCEABB] text-[9px] tracking-[0.2em] uppercase [text-shadow:_0_1px_2px_black]'
    },
];

export function DescriptionStylePicker({ value, onChange }: DescriptionStylePickerProps) {
    const currentValue = (value && styles.some(s => s.id === value)) ? value : 'classique-italique';

    return (
        <div className="space-y-3">
            <Label className="text-muted-foreground flex items-center gap-2">Style du texte sur photo</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {styles.map((style) => {
                    const isSelected = currentValue === style.id;
                    return (
                        <div
                            key={style.id}
                            onClick={() => onChange(style.id)}
                            className={cn(
                                "cursor-pointer rounded-xl border-2 relative overflow-hidden h-20 flex flex-col transition-all",
                                isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-muted hover:border-primary/50"
                            )}
                        >
                            {/* Background image simulation */}
                            <div className={cn("absolute inset-0", style.previewClass)} />
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&q=80')] bg-cover bg-center opacity-60" />
                            
                            {/* Text preview based on style position */}
                            <div className={cn(
                                "relative z-10 flex-1 flex items-center justify-center px-2",
                                style.id === 'gradient-bas' && "items-end pb-2",
                                style.id === 'minimal-haut' && "items-start pt-2"
                            )}>
                                <span className={cn("text-xs text-center", style.demoTextClass)}>
                                    Texte
                                </span>
                            </div>
                            
                            {/* Label below */}
                            <div className="relative z-10 bg-black/40 backdrop-blur-sm py-1">
                                <span className="text-[10px] text-white font-medium block text-center">
                                    {style.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
