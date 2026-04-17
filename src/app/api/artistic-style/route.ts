import { NextRequest, NextResponse } from 'next/server';

/**
 * Cloudinary Photo Filters API
 * Returns Cloudinary transformation URLs for 6 photo filters
 * No AI generation - instant transformations applied to the original image
 */

// Filter configurations with Cloudinary transformation strings
// Enhanced values + noise/grain effects for more distinctive results
const filterConfigs: Record<string, string> = {
  // Noir & Blanc: gris pur + contraste boosté pour plus de punch
  bw: 'e_grayscale,e_contrast:25',
  
  // Sépia: teinte vintage maximale
  sepia: 'e_sepia:100,e_contrast:15',
  
  // Contraste++: contraste fort + légère luminosité
  contrast: 'e_contrast:50,e_brightness:12',
  
  // Vibrant: saturation élevée pour couleurs qui pop
  vibrant: 'e_saturation:65,e_contrast:18,e_brightness:5',
  
  // Vintage: sépia fort + vignette marquée + grain de film (noise)
  vintage: 'e_sepia:80,e_vignette:50,e_brightness:-8,e_contrast:15,e_noise:40',
  
  // Dramatique: très fort contraste + ombres profondes + vignette + grain
  dramatic: 'e_contrast:65,e_shadows:50,e_vignette:55,e_brightness:-15,e_noise:50'
};

// Human-readable filter names
const filterNames: Record<string, string> = {
  bw: 'Noir & Blanc',
  sepia: 'Sépia',
  contrast: 'Contraste++',
  vibrant: 'Vibrant',
  vintage: 'Vintage',
  dramatic: 'Dramatique'
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
    // OR with transformations: /upload/e_grayscale/v1234567890/folder/image.jpg
    const pathParts = pathWithVersion.split('/');
    
    // Find the version segment (starts with 'v' followed by digits)
    const versionIndex = pathParts.findIndex(part => /^v\d+$/.test(part));
    
    let cleanPath: string;
    if (versionIndex > 0) {
      // Skip transformation segments before the version
      cleanPath = pathParts.slice(versionIndex).join('/');
    } else if (versionIndex === 0) {
      // No transformations, path starts with version
      cleanPath = pathWithVersion;
    } else {
      // Fallback: assume last part is filename, rest is path
      const lastPart = pathParts[pathParts.length - 1];
      const folderPath = pathParts.slice(0, -1).join('/');
      cleanPath = folderPath ? folderPath + '/' + lastPart : lastPart;
    }
    
    // Get the transformation string for the selected filter
    const transformation = filterConfigs[filter];
    
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







