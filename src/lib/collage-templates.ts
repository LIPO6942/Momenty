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

    // ──────────────────────────────────────
    // 2 PHOTOS
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
    {
        id: 'top-and-bottom',
        name: 'Superposé',
        photoCount: 2,
        gridTemplateColumns: '1fr',
        gridTemplateRows: '1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1' },
            { slotIndex: 1, gridColumn: '1', gridRow: '2' },
        ],
    },
    {
        id: 'diagonal-split-2',
        name: 'Split 1/3 - 2/3',
        photoCount: 2,
        gridTemplateColumns: '1fr 2fr',
        gridTemplateRows: '1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1' },
        ],
    },

    // ──────────────────────────────────────
    // 3 PHOTOS
    // ──────────────────────────────────────
    {
        id: 'large-left-2',
        name: '1 grande + 2 à droite',
        photoCount: 3,
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1 / span 2' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1' },
            { slotIndex: 2, gridColumn: '2', gridRow: '2' },
        ],
    },
    {
        id: 'large-right-2',
        name: '2 à gauche + 1 grande',
        photoCount: 3,
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1' },
            { slotIndex: 1, gridColumn: '1', gridRow: '2' },
            { slotIndex: 2, gridColumn: '2', gridRow: '1 / span 2' },
        ],
    },
    {
        id: 'banner-top-2',
        name: 'Bannière haut',
        photoCount: 3,
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1 / span 2', gridRow: '1' },
            { slotIndex: 1, gridColumn: '1', gridRow: '2' },
            { slotIndex: 2, gridColumn: '2', gridRow: '2' },
        ],
    },
    {
        id: 'banner-bottom-2',
        name: 'Bannière bas',
        photoCount: 3,
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1' },
            { slotIndex: 2, gridColumn: '1 / span 2', gridRow: '2' },
        ],
    },
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
    {
        id: 'trio-vertical',
        name: 'Trio vertical',
        photoCount: 3,
        gridTemplateColumns: '1fr',
        gridTemplateRows: '1fr 1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1' },
            { slotIndex: 1, gridColumn: '1', gridRow: '2' },
            { slotIndex: 2, gridColumn: '1', gridRow: '3' },
        ],
    },

    // ──────────────────────────────────────
    // 4 PHOTOS
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
    {
        id: 'large-top-3',
        name: '1 grande + 3 petites',
        photoCount: 4,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '2fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1 / span 3', gridRow: '1' },
            { slotIndex: 1, gridColumn: '1', gridRow: '2' },
            { slotIndex: 2, gridColumn: '2', gridRow: '2' },
            { slotIndex: 3, gridColumn: '3', gridRow: '2' },
        ],
    },
    {
        id: 'large-left-3',
        name: '1 grande gauche + 3',
        photoCount: 4,
        gridTemplateColumns: '2fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1 / span 3' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1' },
            { slotIndex: 2, gridColumn: '2', gridRow: '2' },
            { slotIndex: 3, gridColumn: '2', gridRow: '3' },
        ],
    },
    {
        id: 'row-4',
        name: 'Bandeau de 4',
        photoCount: 4,
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gridTemplateRows: '1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1' },
            { slotIndex: 2, gridColumn: '3', gridRow: '1' },
            { slotIndex: 3, gridColumn: '4', gridRow: '1' },
        ],
    },

    // ──────────────────────────────────────
    // 5 PHOTOS
    // ──────────────────────────────────────
    {
        id: 'banner-4',
        name: '1 Bannière + 4 Grille',
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
    {
        id: 'large-center-4',
        name: 'Centre + 4 coins',
        photoCount: 5,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1 / span 2' },
            { slotIndex: 2, gridColumn: '3', gridRow: '1' },
            { slotIndex: 3, gridColumn: '1', gridRow: '2' },
            { slotIndex: 4, gridColumn: '3', gridRow: '2' },
        ],
    },

    // ──────────────────────────────────────
    // 6 PHOTOS
    // ──────────────────────────────────────
    {
        id: 'grid-3x2',
        name: 'Grille 3×2',
        photoCount: 6,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1' },
            { slotIndex: 2, gridColumn: '3', gridRow: '1' },
            { slotIndex: 3, gridColumn: '1', gridRow: '2' },
            { slotIndex: 4, gridColumn: '2', gridRow: '2' },
            { slotIndex: 5, gridColumn: '3', gridRow: '2' },
        ],
    },
    {
        id: 'large-left-5',
        name: '1 grande + 5 petites',
        photoCount: 6,
        gridTemplateColumns: '2fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
        slots: [
            { slotIndex: 0, gridColumn: '1', gridRow: '1 / span 3' },
            { slotIndex: 1, gridColumn: '2', gridRow: '1' },
            { slotIndex: 2, gridColumn: '3', gridRow: '1' },
            { slotIndex: 3, gridColumn: '2', gridRow: '2' },
            { slotIndex: 4, gridColumn: '3', gridRow: '2' },
            { slotIndex: 5, gridColumn: '2 / span 2', gridRow: '3' },
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
