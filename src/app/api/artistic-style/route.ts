import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary avec les clés secrètes pour signer l'URL
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// On utilise e_gen_restyle qui est le moteur IA (Stable Diffusion) natif de Cloudinary.
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

// Extrait l'ID public depuis une URL Cloudinary
function getPublicIdFromUrl(url: string) {
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    let path = parts[1];
    // Enlever le numéro de version (ex: v171243/... )
    if (path.match(/^v\d+\//)) {
      path = path.replace(/^v\d+\//, '');
    }
    // Enlever l'extension
    const lastDotIndex = path.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      path = path.substring(0, lastDotIndex);
    }
    return path;
  } catch (e) {
    return null;
  }
}

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

    const publicId = getPublicIdFromUrl(photoUrl);
    if (!publicId) {
       return NextResponse.json({ error: 'Format d\'URL Cloudinary non reconnu.' }, { status: 400 });
    }

    const rawPrompt = styleGenPrompts[style] ?? `a ${style} style artwork`;
    // Cloudinary recommande de remplacer les espaces par des underscores pour les prompts
    const safePrompt = rawPrompt.replace(/ /g, '_');
    
    // Cloudinary exige absolument de SIGNER (sign_url: true) les transformations d'IA Générative
    // Sinon le lien renvoie une erreur 400.
    const generatedUrl = cloudinary.url(publicId, {
       effect: `gen_restyle:prompt_${safePrompt}`,
       sign_url: true,
       secure: true
    });

    return NextResponse.json({ artisticUrl: generatedUrl });
    
  } catch (error: any) {
    console.error('Artistic style error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}

