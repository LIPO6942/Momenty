// Collage template definitions
// Each slot defines CSS grid positioning properties

export interface SlotDefinition {
    slotIndex: number;
    gridColumn: string;  // e.g. "1" or "1 / span 2"
    gridRow: string;     // e.g. "1" or "1 / span 2"
}

export interface CollageTemplateDef {
    id: string;
    name: string;
    photoCount: number; // Exact number of photos required
    gridTemplateColumns: string;
    gridTemplateRows: string;
    slots: SlotDefinition[];
    aspectRatio?: string; // Preview aspect ratio e.g. "2/1"
}

export const COLLAGE_TEMPLATES: CollageTemplateDef[] = [
    // ──────────────────────────────────────
    // Modèle 1 — "Côte à côte" (2 photos)
    // ──────────────────────────────────────
    {
        id: 'side-by-side',
        name: 'Côte à côte',
        photoCount: 2,
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1' },
        ],
    },

    // ──────────────────────────────────────
    // Modèle 2 — "1 grande + 2" (3 photos)
    // Slot A : col 1, row span 2 (grande photo gauche)
    // ──────────────────────────────────────
    {
        id: 'large-left-2',
        name: '1 grande + 2',
        photoCount: 3,
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1 / span 2' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1' },
            { slotIndex: 2, gridColumn: '2', gridRow: '2' },
        ],
    },

    // ──────────────────────────────────────
    // Modèle 3 — "Banner + 2" (3 photos)
    // Slot A : col span 2, row 1 (bannière pleine largeur)
    // ──────────────────────────────────────
    {
        id: 'banner-top-2',
        name: 'Banner + 2',
        photoCount: 3,
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1 / span 2', gridRow: '1' },
            { slotIndex: 1, gridColumn: '1', gridRow: '2' },
            { slotIndex: 2, gridColumn: '2', gridRow: '2' },
        ],
    },

    // ──────────────────────────────────────
    // Modèle 4 — "Grille 2×2" (4 photos)
    // ──────────────────────────────────────
    {
        id: 'grid-2x2',
        name: 'Grille 2×2',
        photoCount: 4,
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1' },
            { slotIndex: 2, gridColumn: '1', gridRow: '2' },
            { slotIndex: 3, gridColumn: '2', gridRow: '2' },
        ],
    },

    // ──────────────────────────────────────
    // Modèle 5 — "Grande gauche 2/3" (3 photos)
    // Slot A : col 1, row span 2 (2/3 largeur)
    // ──────────────────────────────────────
    {
        id: 'large-left-wide',
        name: 'Grande 2/3',
        photoCount: 3,
        gridTemplateColumns: '2fr 1fr',
        gridTemplateRows: '1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1 / span 2' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1' },
            { slotIndex: 2, gridColumn: '2', gridRow: '2' },
        ],
    },

    // ──────────────────────────────────────
    // Modèle 6 — "Trio horizontal" (3 photos)
    // 3 slots égaux en ligne
    // ──────────────────────────────────────
    {
        id: 'trio-horizontal',
        name: 'Trio horizontal',
        photoCount: 3,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1' },
            { slotIndex: 2, gridColumn: '3', gridRow: '1' },
        ],
    },

    // ──────────────────────────────────────
    // Modèle 7 — "Banner + 4" (5 photos)
    // Slot A : col span 2, row 1 (bannière)
    // Slots B/C/D/E : grille 2×2 en rows 2 et 3
    // ──────────────────────────────────────
    {
        id: 'banner-4',
        name: 'Banner + 4',
        photoCount: 5,
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1 / span 2', gridRow: '1' },
            { slotIndex: 1, gridColumn: '1', gridRow: '2' },
            { slotIndex: 2, gridColumn: '2', gridRow: '2' },
            { slotIndex: 3, gridColumn: '1', gridRow: '3' },
            { slotIndex: 4, gridColumn: '2', gridRow: '3' },
        ],
    },
];

/** Returns only templates matching the given photo count */
export function getCompatibleTemplates(photoCount: number): CollageTemplateDef[] {
    return COLLAGE_TEMPLATES.filter(t => t.photoCount === photoCount);
}

/** Returns a template by ID */
export function getTemplateById(id: string): CollageTemplateDef | undefined {
    return COLLAGE_TEMPLATES.find(t => t.id === id);
}
