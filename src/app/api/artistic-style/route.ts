import { NextRequest, NextResponse } from 'next/server';

// On utilise e_gen_restyle qui est le moteur IA (Stable Diffusion) natif de Cloudinary.
// Il garde les traits de la photo et la redessine selon le prompt.
const styleGenPrompts: Record<string, string> = {
  vangogh: 'a Van Gogh painting with swirling colors and thick brush strokes',
  manga: 'super detailed anime manga style artwork, studio ghibli, makoto shinkai, perfect character design, cel shading',
  monet: 'an impressionist painting by Claude Monet, soft lighting',
  abstract: 'an abstract geometric cubist painting, vibrant',
  oil: 'a classical renaissance oil painting, highly detailed',
  watercolor: 'a delicate watercolor painting, soft bleeding ethereal colors',
  'line art': 'a clean black and white ink line art drawing',
  comic: 'an american comic book illustration, pop art shading',
  cyberpunk: 'a futuristic cyberpunk artwork, neon lights',
  fantasy: 'a beautiful ethereal fantasy digital painting',
  renaissance: 'a classical Renaissance era portrait painting',
  ukiyoe: 'a traditional Japanese ukiyo-e woodblock print',
};

export async function POST(req: NextRequest) {
  try {
    const { photoUrl, style } = await req.json();

    if (!photoUrl || !style) {
      return NextResponse.json({ error: 'photoUrl and style are required' }, { status: 400 });
    }

    if (!photoUrl.includes('res.cloudinary.com')) {
      return NextResponse.json(
        { error: 'L\'image doit d\'abord être hébergée sur notre serveur (Cloudinary).' },
        { status: 400 }
      );
    }

    const prompt = styleGenPrompts[style] ?? `a ${style} style artwork`;
    const effect = `e_gen_restyle:prompt_${encodeURIComponent(prompt)}`;

    // Cloudinary URLs: https://res.cloudinary.com/<cloud>/image/upload/v123456/folder/file.jpg
    let generatedUrl = photoUrl;
    if (photoUrl.includes('/upload/')) {
       generatedUrl = photoUrl.replace('/upload/', `/upload/${effect}/`);
    } else {
       return NextResponse.json({ error: 'Format d\'URL Cloudinary non reconnu.' }, { status: 400 });
    }

    // Le backend ne fait que retourner la bonne URL avec l'effet.
    return NextResponse.json({ artisticUrl: generatedUrl });
    
  } catch (error: any) {
    console.error('Artistic style error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
