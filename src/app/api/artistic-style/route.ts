import { NextRequest, NextResponse } from 'next/server';

/**
 * Cloudinary Photo Filters API
 * Returns Cloudinary transformation URLs for 6 photo filters
 * No AI generation - instant transformations applied to the original image
 */

// Filter configurations with Cloudinary transformation strings
// Using ONLY widely-supported transformations (grayscale, sepia, saturation, brightness, contrast, blur)
// Avoid: distort, noise, tint advanced syntax, gamma - these may fail on free/basic plans
const filterConfigs: Record<string, string> = {
  // Noir & Blanc: grayscale + contrast boost
  // Conservative transforms using widely-supported effects (avoid paid-only ops)
  bw: 'e_grayscale,e_contrast:30',

  sepia: 'e_sepia,e_contrast:12',
  
  // Fisheye: simulate with strong vignette and mild saturation
  fisheye: 'e_vignette:80,e_saturation:30',
  
  // Vibrant: maximum saturation
  vibrant: 'e_saturation:120,e_contrast:12',
  
  // Vintage: sepia + vignette + dither (paper texture effect) + contrast
  // Vintage: warm sepia + vignette + contrast + subtle grain
  vintage: 'e_sepia:80,e_vignette:60,e_contrast:28,e_saturation:-12',
  
  // Cinéma: warm tone simulated with sepia + contrast + brightness + vignette
  // (using basic transformations instead of advanced tint)
  // Cinema: warm tone, punchy contrast
  cinema: 'e_sepia:30,e_contrast:16,e_vignette:30'
};

// Human-readable filter names
const filterNames: Record<string, string> = {
  bw: 'Noir & Blanc',
  sepia: 'Sépia',
  fisheye: 'Fisheye',
  vibrant: 'Vibrant',
  vintage: 'Vintage',
  cinema: 'Cinéma'
};

export async function POST(req: NextRequest) {
  try {
    const { photoUrl, filter } = await req.json();
    
    console.log(`[Photo Filter] Received request - filter: ${filter}, photoUrl: ${photoUrl?.substring(0, 80)}...`);
    
    if (!photoUrl || !filter) {
      return NextResponse.json({ 
        error: 'photoUrl and filter are required' 
      }, { status: 400 });
    }

    // Validate filter
    if (!filterConfigs[filter]) {
      return NextResponse.json({ 
        error: `Invalid filter: ${filter}. Valid filters: ${Object.keys(filterConfigs).join(', ')}` 
      }, { status: 400 });
    }

    // Only process Cloudinary URLs
    if (!photoUrl.includes('res.cloudinary.com')) {
      return NextResponse.json({ 
        error: 'Only Cloudinary URLs are supported for photo filters' 
      }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(photoUrl);
    } catch (err) {
      console.error('[Photo Filter] URL parse failed for:', photoUrl, err);
      return NextResponse.json({ 
        error: 'Invalid Cloudinary URL' 
      }, { status: 400 });
    }

    const pathMatch = parsedUrl.pathname.match(/^(\/[^/]+\/image\/upload\/)(.*)$/);
    if (!pathMatch) {
      console.error('[Photo Filter] URL pathname match failed for:', parsedUrl.pathname);
      return NextResponse.json({ 
        error: 'Invalid Cloudinary URL format' 
      }, { status: 400 });
    }

    const [, uploadPrefix, pathWithVersion] = pathMatch;
    const baseUrl = `${parsedUrl.origin}${uploadPrefix}`;
    const pathParts = pathWithVersion.split('/');

    const versionIndex = pathParts.findIndex(part => /^v\d+$/.test(part));
    let cleanPath: string;
    if (versionIndex >= 0) {
      cleanPath = pathParts.slice(versionIndex).join('/');
    } else {
      const folderIndex = pathParts.findIndex(part => part.includes('_') && !part.includes(','));
      if (folderIndex >= 0) {
        cleanPath = pathParts.slice(folderIndex).join('/');
      } else {
        const safeParts = pathParts.filter((part, idx) => {
          if (idx === pathParts.length - 1) return true;
          return !part.includes(',') && !part.match(/^(c_|w_|h_|e_|q_|f_|v)\d/);
        });
        cleanPath = safeParts.join('/');
      }
    }

    const transformation = filterConfigs[filter];
    console.log(`[Photo Filter] transformation: ${transformation}`);

    const normalizedCleanPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
    const timestamp = Date.now();
    const searchSuffix = parsedUrl.search ? parsedUrl.search.replace(/^\?/, '&') : '';
    const filteredUrl = `${baseUrl}${transformation},q_auto:best,f_auto/${normalizedCleanPath}?_cb=${timestamp}${searchSuffix}${parsedUrl.hash}`;
    
    console.log(`[Photo Filter] baseUrl: ${baseUrl}`);
    console.log(`[Photo Filter] cleanPath: ${cleanPath}`);
    console.log(`[Photo Filter] Applied ${filterNames[filter]} filter: ${filteredUrl}`);

    return NextResponse.json({ 
      filteredUrl,
      filter,
      filterName: filterNames[filter]
    });
    
  } catch (error: any) {
    console.error('[Photo Filter] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: String(error) 
    }, { status: 500 });
  }
}







