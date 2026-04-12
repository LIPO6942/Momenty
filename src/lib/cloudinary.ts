export function clTransform(
  url: string,
  opts: { w?: number; h?: number; c?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | string; g?: 'auto' | string; q?: string; f?: string; e?: string } = {}
): string {
  try {
    if (!url || typeof url !== 'string') return url;
    const isCloudinary = url.includes('/upload/') && url.includes('res.cloudinary.com');
    if (!isCloudinary) return url;

    const u = new URL(url);
    const parts = u.pathname.split('/');
    const uploadIndex = parts.findIndex(p => p === 'upload');
    if (uploadIndex === -1) return url;

    const params: string[] = [];
    const q = opts.q ?? 'q_auto';
    const f = opts.f ?? 'f_auto';
    if (opts.c) params.push(`c_${opts.c}`);
    if (opts.g && opts.c !== 'fit') params.push(`g_${opts.g}`);
    if (opts.w) params.push(`w_${opts.w}`);
    if (opts.h) params.push(`h_${opts.h}`);
    if (opts.e) params.push(`e_${opts.e}`);
    params.push(q);
    params.push(f);

    // Insert the transformation segment right after 'upload'
    const before = parts.slice(0, uploadIndex + 1);
    const after = parts.slice(uploadIndex + 1);
    const transformationString = params.join(',');
    const newPath = [...before, transformationString, ...after].join('/');

    return `${u.origin}${newPath}`;
  } catch {
    return url;
  }
}

// Artistic style transformations using Cloudinary effects
export type ArtisticStyleKey = 'manga' | 'vangogh' | 'monet' | 'picasso' | 'abstract' | 'athena' | 'audrey' | 'fes' | 'incognito' | 'quartz' | 'red_rock';

const artisticEffectMap: Record<ArtisticStyleKey, string> = {
  manga: 'art:manga',
  vangogh: 'art:quartz', // Quartz gives Van Gogh-like swirling effect
  monet: 'art:al_dente', // Soft painterly effect
  picasso: 'art:hairspray', // Cubist/cartoon-like transformation
  abstract: 'art:incognito', // Abstract/distorted effect
  athena: 'art:athena', // Classical painting style
  audrey: 'art:audrey', // Vintage/high contrast style
  fes: 'art:fes', // Oriental/ornate style
  quartz: 'art:quartz', // Alternative Van Gogh
  red_rock: 'art:red_rock', // Oil painting texture
};

export function buildArtisticTransform(
  url: string,
  style: ArtisticStyleKey,
  opts: { w?: number; h?: number; c?: 'fill' | 'fit' | string } = {}
): string {
  const effect = artisticEffectMap[style];
  if (!effect) return url;

  return clTransform(url, {
    w: opts.w ?? 1200,
    h: opts.h ?? 900,
    c: opts.c ?? 'fill',
    g: 'auto',
    e: effect,
  });
}

// Helper to get all available artistic styles with labels
export const artisticStyles: { key: ArtisticStyleKey; label: string; emoji: string }[] = [
  { key: 'manga', label: 'Manga', emoji: '🎌' },
  { key: 'vangogh', label: 'Van Gogh', emoji: '🌻' },
  { key: 'monet', label: 'Monet', emoji: '🌸' },
  { key: 'picasso', label: 'Picasso', emoji: '🎭' },
  { key: 'abstract', label: 'Abstrait', emoji: '🎨' },
  { key: 'athena', label: 'Classique', emoji: '🏛️' },
  { key: 'audrey', label: 'Vintage', emoji: '🎬' },
  { key: 'fes', label: 'Oriental', emoji: '🕌' },
  { key: 'red_rock', label: 'Huile', emoji: '🖼️' },
  { key: 'quartz', label: 'Tourbillon', emoji: '💫' },
  { key: 'incognito', label: 'Mystère', emoji: '🎭' },
];

// Helpers to map persisted display preferences to Cloudinary transforms
export type DisplayTransform = {
  preset?: 'landscape' | 'portrait' | 'square';
  crop?: 'fill' | 'fit';
  gravity?: 'auto' | 'center' | 'custom';
  positionX?: number;
  positionY?: number;
};

export function buildTransformFromDisplay(dt?: DisplayTransform): { w: number; h: number; c: 'fill' | 'fit'; g: string } {
  const preset = dt?.preset ?? 'landscape';
  const crop = (dt?.crop ?? 'fit') as 'fill' | 'fit';
  const gravity = dt?.gravity ?? 'auto';
  
  let g = gravity;
  if (gravity === 'custom' && dt?.positionX !== undefined && dt?.positionY !== undefined) {
    // Cloudinary uses gravity xy_center for manual offsets
    // But actually g_custom is not a thing, it should be g_north, etc.
    // Or we use the CSS object-position for simplicity and just tell Cloudinary 'auto' or 'center'
    g = 'auto'; 
  }

  switch (preset) {
    case 'portrait':
      return { w: 900, h: 1200, c: crop, g: g };
    case 'square':
      return { w: 1000, h: 1000, c: crop, g: g };
    case 'landscape':
    default:
      return { w: 1200, h: 900, c: crop, g: g };
  }
}
