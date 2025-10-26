export function clTransform(
  url: string,
  opts: { w?: number; h?: number; c?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | string; g?: 'auto' | string; q?: string; f?: string } = {}
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
    if (opts.g) params.push(`g_${opts.g}`);
    if (opts.w) params.push(`w_${opts.w}`);
    if (opts.h) params.push(`h_${opts.h}`);
    params.push(q);
    params.push(f);

    // Insert the transformation segment right after 'upload'
    const before = parts.slice(0, uploadIndex + 1);
    const after = parts.slice(uploadIndex + 1);
    const newPath = [...before, params.join(','), ...after].join('/');

    return `${u.protocol}//${u.host}${newPath}`;
  } catch {
    return url;
  }
}

// Helpers to map persisted display preferences to Cloudinary transforms
export type DisplayTransform = {
  preset?: 'landscape' | 'portrait' | 'square';
  crop?: 'fill' | 'fit';
  gravity?: 'auto' | 'center';
};

export function buildTransformFromDisplay(dt?: DisplayTransform): { w: number; h: number; c: 'fill' | 'fit'; g: 'auto' | 'center' } {
  const preset = dt?.preset ?? 'landscape';
  const crop = (dt?.crop ?? 'fill') as 'fill' | 'fit';
  const gravity = (dt?.gravity ?? 'auto') as 'auto' | 'center';
  switch (preset) {
    case 'portrait':
      return { w: 900, h: 1200, c: crop, g: gravity };
    case 'square':
      return { w: 1000, h: 1000, c: crop, g: gravity };
    case 'landscape':
    default:
      return { w: 1200, h: 900, c: crop, g: gravity };
  }
}
