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
