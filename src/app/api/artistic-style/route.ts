import { NextRequest, NextResponse } from 'next/server';

const styleGenPrompts: Record<string, string> = {
  vangogh: 'Van Gogh painting style, swirling brush strokes, impressionism, thick paint',
  manga: '2D Anime Manga style illustration, studio ghibli anime, makoto shinkai aesthetic, perfect cel shading, highly detailed manga art',
  monet: 'impressionist painting by Claude Monet, soft lighting, peaceful, painterly',
  abstract: 'abstract geometric cubist painting, vibrant abstract art, Picasso style',
  oil: 'classical renaissance oil painting, highly detailed masterpiece, sfumato',
  watercolor: 'delicate watercolor painting, soft bleeding ethereal colors',
  'line art': 'clean black and white ink line art drawing, minimal contour',
  comic: 'american comic book illustration, pop art shading, bold outlines',
  cyberpunk: 'futuristic cyberpunk artwork, neon street lights, sci-fi dystopian',
  fantasy: 'beautiful ethereal fantasy digital painting, magical glow, fantasy world',
  renaissance: 'classical Renaissance era portrait painting, sfumato lighting',
  ukiyoe: 'traditional Japanese ukiyo-e woodblock print, flat vibrant colors',
};

async function getImageCaption(photoUrl: string, token: string): Promise<string | null> {
  try {
    const photoResponse = await fetch(photoUrl, { signal: AbortSignal.timeout(10000) });
    if (!photoResponse.ok) return null;
    
    const buffer = await photoResponse.arrayBuffer();

    // Call HuggingFace BLIP Model to caption the image
    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-large',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: buffer,
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!hfResponse.ok) {
      console.warn("HF Captioning failed:", hfResponse.status, await hfResponse.text());
      return null;
    }

    const result = await hfResponse.json();
    // Usually returns [{ generated_text: "a caption..." }]
    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text;
    }
    return null;
  } catch (error) {
    console.error("Captioning error:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { photoUrl, style } = await req.json();

    if (!photoUrl || !style) {
      return NextResponse.json({ error: 'photoUrl and style are required' }, { status: 400 });
    }

    const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
    const styleDescription = styleGenPrompts[style] ?? `a ${style} style artwork`;
    
    let caption = "";
    if (HF_TOKEN) {
      // 1. D'abord, on génère une description textuelle de l'image (Image to Text)
      const detectedCaption = await getImageCaption(photoUrl, HF_TOKEN);
      if (detectedCaption) {
         caption = `The scene shows EXACTLY THIS: ${detectedCaption}. `;
      }
    }

    // 2. Construction du Prompt Ultime Mêlant le style et la description de l'image
    const finalPrompt = `${styleDescription}. ${caption} KEEP EXACT SAME FACES, PEOPLE, POSITIONS, AND BACKGROUND LAYOUT. DO NOT change the identity of the subjects. Masterpiece, highly detailed.`;

    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    // Cloudinary optimization for img2img reference
    let optimizedImageUrl = photoUrl;
    if (photoUrl.includes('res.cloudinary.com')) {
        optimizedImageUrl = photoUrl.replace('/upload/', '/upload/c_limit,w_512,h_512/');
    }
    const encodedImage = encodeURIComponent(optimizedImageUrl);

    // 3. Appel de Pollinations (Text-to-Image avec référence image et prompt lourd)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImage}&width=1024&height=1024&model=flux&nologo=true`;

    return NextResponse.json({ artisticUrl: pollinationsUrl });
    
  } catch (error: any) {
    console.error('Artistic style error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}


