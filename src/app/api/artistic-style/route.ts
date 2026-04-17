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
      return NextResponse.json({ 
        error: 'Invalid Cloudinary URL format' 
      }, { status: 400 });
    }

    const [, baseUrl, pathWithTransformations] = cloudinaryMatch;
    
    // Remove any existing transformations from the path
    // Transformations are comma-separated before the version/folder path
    const pathParts = pathWithTransformations.split('/');
    const lastPart = pathParts[pathParts.length - 1]; // filename
    const folderPath = pathParts.slice(0, -1).join('/');
    
    // Check if first segment contains transformations (has commas or effect prefixes)
    const firstSegment = folderPath.split('/')[0];
    const hasTransformations = firstSegment.includes(',') || 
                               firstSegment.startsWith('e_') ||
                               firstSegment.startsWith('c_') ||
                               firstSegment.startsWith('w_') ||
                               firstSegment.startsWith('h_');
    
    // Build clean path without existing transformations
    let cleanPath: string;
    if (hasTransformations) {
      cleanPath = folderPath.split('/').slice(1).join('/') + '/' + lastPart;
    } else {
      cleanPath = folderPath + '/' + lastPart;
    }
    
    // Get the transformation string for the selected filter
    const transformation = filterConfigs[filter];
    
    // Build the filtered URL
    // Add quality and format optimizations
    const filteredUrl = `${baseUrl}${transformation},q_auto:best,f_auto/${cleanPath}`;
    
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







