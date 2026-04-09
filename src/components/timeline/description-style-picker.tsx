import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export type DescriptionStyle = 'chat' | 'magazine' | 'vibrant' | 'cinematic' | 'polaroid';

interface DescriptionStylePickerProps {
    value: DescriptionStyle | undefined;
    onChange: (style: DescriptionStyle) => void;
}

const styles: { id: DescriptionStyle; label: string; previewClass: string }[] = [
    { id: 'chat', label: 'Bulle (Défaut)', previewClass: 'bg-white/20 backdrop-blur-md rounded-xl rounded-bl-sm border border-white/30' },
    { id: 'magazine', label: 'Éditorial', previewClass: 'bg-black/40 backdrop-blur-sm border-l-4 border-indigo-400' },
    { id: 'vibrant', label: 'Vibrant', previewClass: 'bg-gradient-to-br from-pink-500/40 to-indigo-500/40 backdrop-blur-md border border-white/40 rounded-xl' },
    { id: 'cinematic', label: 'Cinématique', previewClass: 'bg-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' },
    { id: 'polaroid', label: 'Pellicule', previewClass: 'bg-black/60 border border-white/20 font-mono text-[10px] uppercase tracking-widest' },
];

export function DescriptionStylePicker({ value, onChange }: DescriptionStylePickerProps) {
    const currentValue = value || 'chat';

    return (
        <div className="space-y-3">
            <Label className="text-muted-foreground flex items-center gap-2">Style du texte sur photo</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {styles.map((style) => {
                    const isSelected = currentValue === style.id;
                    return (
                        <div
                            key={style.id}
                            onClick={() => onChange(style.id)}
                            className={cn(
                                "cursor-pointer rounded-lg border-2 p-2 relative overflow-hidden h-16 flex items-center justify-center transition-all",
                                isSelected ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-muted hover:border-primary/50"
                            )}
                        >
                            {/* A mini preview of the style */}
                            <div className="absolute inset-0 bg-slate-800" />
                            <div className={cn("z-10 px-2 py-1 flex items-center justify-center text-white text-xs text-center w-full shadow-sm", style.previewClass)}>
                                <span className={cn(style.id === 'magazine' && "first-letter:text-lg first-letter:font-bold first-letter:text-indigo-300")}>
                                    Texte
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
