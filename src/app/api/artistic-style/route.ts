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
  // Strong B&W: true grayscale + auto contrast + darker tones + grain
  bw: 'e_grayscale:100,e_auto_contrast,e_contrast:30,e_brightness:-6,e_grain:40',

  // Sépia: classic sepia with auto color and subtle grain
  sepia: 'e_sepia:100,e_auto_color,e_contrast:18,e_brightness:-4,e_grain:14',
  
  // Fisheye: best-effort simulation using vignette, radial blur and auto color
  // True geometric fisheye requires paid/advanced transforms; this simulates the visual.
  fisheye: 'e_vignette:90,e_radial_blur:1,e_auto_color,e_saturation:30,e_brightness:8,e_grain:12',
  
  // Vibrant: maximum saturation
  // Vibrant: aggressive saturation with auto color-correction and sharpen-like clarity
  vibrant: 'e_auto_color,e_saturation:140,e_contrast:22,e_brightness:6,e_grain:6',
  
  // Vintage: sepia + vignette + dither (paper texture effect) + contrast
  // Vintage + paper texture: strong dither + heavy grain to simulate aged paper/film
  vintage: 'e_sepia:85,e_vignette:75,e_ordered_dither:10,e_brightness:-14,e_contrast:36,e_saturation:-16,e_grain:48',
  
  // Cinéma: warm tone simulated with sepia + contrast + brightness + vignette
  // (using basic transformations instead of advanced tint)
  // Cinema: warm tone, punchy contrast and subtle film grain
  cinema: 'e_sepia:35,e_auto_color,e_contrast:20,e_vignette:30,e_saturation:28,e_grain:12'
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

    // Extract the base URL parts
    // Cloudinary URL format: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{path}
    const cloudinaryMatch = photoUrl.match(/(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)/);
    
    if (!cloudinaryMatch) {
      console.error('[Photo Filter] URL regex match failed for:', photoUrl);
      return NextResponse.json({ 
        error: 'Invalid Cloudinary URL format' 
      }, { status: 400 });
    }

    const [, baseUrl, pathWithVersion] = cloudinaryMatch;
    
    // Remove any existing transformations from the path
    // Cloudinary URLs have format: /upload/v1234567890/folder/image.jpg
    // OR with transformations: /upload/c_fill,w_200,h_200,e_grayscale/v1234567890/folder/image.jpg
    const pathParts = pathWithVersion.split('/');
    
    // Find the version segment (starts with 'v' followed by digits)
    const versionIndex = pathParts.findIndex(part => /^v\d+$/.test(part));
    
    let cleanPath: string;
    if (versionIndex >= 0) {
      // Keep from version onwards (this removes all transformations before version)
      cleanPath = pathParts.slice(versionIndex).join('/');
    } else {
      // Fallback: look for the folder path pattern (usually contains 'moment/' or similar)
      const folderIndex = pathParts.findIndex(part => part.includes('_') && !part.includes(','));
      if (folderIndex >= 0) {
        cleanPath = pathParts.slice(folderIndex).join('/');
      } else {
        // Last resort: assume everything before last part with comma is transformation
        const lastPart = pathParts[pathParts.length - 1];
        const safeParts = pathParts.filter((part, idx) => {
          if (idx === pathParts.length - 1) return true; // keep filename
          return !part.includes(',') && !part.match(/^(c_|w_|h_|e_|q_|f_|v)\d/);
        });
        cleanPath = safeParts.join('/');
      }
    }
    
    // Get the transformation string for the selected filter
    const transformation = filterConfigs[filter];
    console.log(`[Photo Filter] transformation: ${transformation}`);
    
    // Build the filtered URL carefully
    // Ensure cleanPath doesn't start with / to avoid double slashes
    const normalizedCleanPath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
    
    // Add cache-busting timestamp to force fresh image load
    const timestamp = Date.now();
    const filteredUrl = `${baseUrl}${transformation},q_auto:best,f_auto/${normalizedCleanPath}?_cb=${timestamp}`;
    
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







