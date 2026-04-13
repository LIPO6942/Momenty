import { NextRequest, NextResponse } from 'next/server';

const styleGenPrompts: Record<string, string> = {
  vangogh: 'a Van Gogh painting with swirling colors and thick brush strokes, impressionism style',
  manga: '2D Anime Manga style illustration, studio ghibli anime, makoto shinkai aesthetic, perfect cel shading, colorful manga',
  monet: 'an impressionist painting by Claude Monet, soft lighting, peaceful',
  abstract: 'an abstract geometric cubist painting, vibrant abstract art',
  oil: 'a classical renaissance oil painting, highly detailed masterpiece',
  watercolor: 'a delicate watercolor painting, soft bleeding ethereal colors',
  'line art': 'a clean black and white ink line art drawing, minimal contour',
  comic: 'an american comic book illustration, pop art shading, bold outlines',
  cyberpunk: 'a futuristic cyberpunk artwork, neon street lights, sci-fi dystopian',
  fantasy: 'a beautiful ethereal fantasy digital painting, magical glow',
  renaissance: 'a classical Renaissance era portrait painting, sfumato',
  ukiyoe: 'a traditional Japanese ukiyo-e woodblock print, flat vibrant colors',
};

export async function POST(req: NextRequest) {
  try {
    const { photoUrl, style } = await req.json();

    if (!photoUrl || !style) {
      return NextResponse.json({ error: 'photoUrl and style are required' }, { status: 400 });
    }

    // Le style demandé
    const styleDescription = styleGenPrompts[style] ?? `a ${style} style artwork`;
    
    // Instruction EXTRÊMEMENT stricte pour forcer l'IA à utiliser l'image originale comme ControlNet
    const prompt = `EXACT COPY of the provided image but transformed into: ${styleDescription}. KEEEP EXACT SAME FACES, SAME PEOPLE, SAME POSITIONS, SAME BACKGROUND LAYOUT. DO NOT change the identity of the subjects.`;

    const encodedPrompt = encodeURIComponent(prompt);
    
    // Si l'image vient de Cloudinary, on réduit sa taille pour que Pollinations puisse l'avaler comme modèle (image2image)
    let optimizedImageUrl = photoUrl;
    if (photoUrl.includes('res.cloudinary.com')) {
        // Redimensionner l'image source à 512px max pour mieux marcher comme inpainting/img2img
        optimizedImageUrl = photoUrl.replace('/upload/', '/upload/c_limit,w_512,h_512/');
    }

    const encodedImage = encodeURIComponent(optimizedImageUrl);

    // Construction de l'URL Pollinations :
    // model=flux (le plus performant actuellement pour l'img2img)
    // enhance=false (on ne veut pas qu'il hallucine des détails)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImage}&width=1024&height=1024&model=flux&nologo=true`;

    return NextResponse.json({ artisticUrl: pollinationsUrl });
    
  } catch (error: any) {
    console.error('Artistic style error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}


