"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { COLLAGE_TEMPLATES, CollageTemplateDef } from "@/lib/collage-templates";

interface CollageTemplatePickerProps {
    photoCount: number;
    selectedTemplateId: string | null;
    onSelect: (template: CollageTemplateDef) => void;
}

/** Renders an SVG preview miniature for a template */
const TemplateMiniature = ({ template, selected }: { template: CollageTemplateDef; selected: boolean }) => {
    const cols = template.gridTemplateColumns.split(' ').length;
    const rows = template.gridTemplateRows.split(' ').length;
    const W = 80;
    const H = 60;
    const gap = 2;
    const pad = 3;

    // Parse fr values to fractions
    const parseFractions = (templateStr: string): number[] => {
        return templateStr.split(' ').map(s => parseFloat(s.replace('fr', '')) || 1);
    };

    const colFrs = parseFractions(template.gridTemplateColumns);
    const rowFrs = parseFractions(template.gridTemplateRows);
    const totalColFr = colFrs.reduce((a, b) => a + b, 0);
    const totalRowFr = rowFrs.reduce((a, b) => a + b, 0);

    const innerW = W - 2 * pad;
    const innerH = H - 2 * pad;
    const totalGapW = gap * (cols - 1);
    const totalGapH = gap * (rows - 1);

    // Compute column x positions and widths
    const colWidths = colFrs.map(fr => (fr / totalColFr) * (innerW - totalGapW));
    const colX: number[] = [];
    let cx = pad;
    for (let i = 0; i < cols; i++) {
        colX.push(cx);
        cx += colWidths[i] + gap;
    }

    // Compute row y positions and heights
    const rowHeights = rowFrs.map(fr => (fr / totalRowFr) * (innerH - totalGapH));
    const rowY: number[] = [];
    let ry = pad;
    for (let i = 0; i < rows; i++) {
        rowY.push(ry);
        ry += rowHeights[i] + gap;
    }

    // Parse grid-column / grid-row CSS spec like "1 / span 2", "2", "1 / span 3"
    const parseGridSpec = (spec: string, sizes: number[], positions: number[]) => {
        const trimmed = spec.trim();
        if (trimmed.includes('/')) {
            const parts = trimmed.split('/').map(s => s.trim());
            const start = parseInt(parts[0]) - 1;
            const spanMatch = parts[1].match(/span\s+(\d+)/);
            const span = spanMatch ? parseInt(spanMatch[1]) : 1;
            return { start, span };
        }
        const start = parseInt(trimmed) - 1;
        return { start, span: 1 };
    };

    const rects = template.slots.map(slot => {
        const colSpec = parseGridSpec(slot.gridColumn, colWidths, colX);
        const rowSpec = parseGridSpec(slot.gridRow, rowHeights, rowY);

        const x = colX[colSpec.start];
        const y = rowY[rowSpec.start];
        const w = colWidths.slice(colSpec.start, colSpec.start + colSpec.span).reduce((a, b) => a + b, 0)
            + gap * (colSpec.span - 1);
        const h = rowHeights.slice(rowSpec.start, rowSpec.start + rowSpec.span).reduce((a, b) => a + b, 0)
            + gap * (rowSpec.span - 1);

        return { x, y, w, h, slotIndex: slot.slotIndex };
    });

    return (
        <div
            className={cn(
                "flex-shrink-0 cursor-pointer rounded-lg overflow-hidden transition-all duration-200",
                "border-2 hover:scale-105",
                selected
                    ? "border-primary shadow-lg shadow-primary/30 scale-105"
                    : "border-slate-200 hover:border-slate-400"
            )}
        >
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block">
                <rect width={W} height={H} fill={selected ? "hsl(var(--primary)/0.08)" : "#f8fafc"} />
                {rects.map((r) => (
                    <rect
                        key={r.slotIndex}
                        x={r.x}
                        y={r.y}
                        width={r.w}
                        height={r.h}
                        rx={1.5}
                        fill={selected ? "hsl(var(--primary)/0.35)" : "#cbd5e1"}
                    />
                ))}
            </svg>
        </div>
    );
};

export function CollageTemplatePicker({ photoCount, selectedTemplateId, onSelect }: CollageTemplatePickerProps) {
    const compatible = COLLAGE_TEMPLATES.filter(t => t.photoCount === photoCount);

    if (compatible.length === 0) return null;

    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Choisissez un modèle de collage
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                {compatible.map(template => (
                    <div
                        key={template.id}
                        className="snap-start flex flex-col items-center gap-1.5"
                        onClick={() => onSelect(template)}
                    >
                        <TemplateMiniature
                            template={template}
                            selected={selectedTemplateId === template.id}
                        />
                        <span className={cn(
                            "text-[10px] font-medium whitespace-nowrap transition-colors",
                            selectedTemplateId === template.id ? "text-primary" : "text-muted-foreground"
                        )}>
                            {template.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
