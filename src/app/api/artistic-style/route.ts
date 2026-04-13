import { NextRequest, NextResponse } from 'next/server';

const styleToCloudinaryEffect: Record<string, string> = {
  vangogh: 'e_art:sizzle',
  monet: 'e_oil_paint:80',
  abstract: 'e_art:incognito',
  cubist: 'e_art:al_dente',
  oil: 'e_oil_paint:100',
  watercolor: 'e_art:audrey',
  'line art': 'e_art:zorro',
  comic: 'e_cartoonify',
  cyberpunk: 'e_art:aurora',
  fantasy: 'e_art:primavera',
  renaissance: 'e_art:athena',
  ukiyoe: 'e_art:hokusai',
};

export async function POST(req: NextRequest) {
  try {
    const { photoUrl, style } = await req.json();

    if (!photoUrl || !style) {
      return NextResponse.json(
        { error: 'photoUrl and style are required' },
        { status: 400 }
      );
    }

    if (!photoUrl.includes('res.cloudinary.com')) {
      return NextResponse.json(
        { error: 'L\'image doit d\'abord être hébergée sur notre serveur (Cloudinary).' },
        { status: 400 }
      );
    }

    const effect = styleToCloudinaryEffect[style] || 'e_art:sizzle';

    // Cloudinary URLs typically look like:
    // https://res.cloudinary.com/<cloud>/image/upload/v123456/folder/file.jpg
    // We want to inject the effect into the transformation string.
    // Replace "/upload/" with "/upload/{effect}/"
    
    let generatedUrl = photoUrl;
    if (photoUrl.includes('/upload/')) {
       generatedUrl = photoUrl.replace('/upload/', `/upload/${effect}/`);
    } else {
       return NextResponse.json(
        { error: 'Format d\'URL Cloudinary non reconnu.' },
        { status: 400 }
      );
    }

    // Since this is instantaneous URL generation, we can just return it!
    // No cold starts, no timeouts, no API costs.
    return NextResponse.json({ artisticUrl: generatedUrl });
    
  } catch (error: any) {
    console.error('Artistic style error (Cloudinary):', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
