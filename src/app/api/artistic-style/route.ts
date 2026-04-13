import { NextRequest, NextResponse } from 'next/server';

const styleGenPrompts: Record<string, string> = {
  manga: 'High quality anime manga style illustration, 2D cel shading, professional anime art, Studio Ghibli vibes, clean vibrant colors, masterpiece',
  abstract: 'Abstract geometric expressionism painting, bold colors, artistic non-representational composition, Picasso and Kandinsky style',
  vangogh: 'Post-impressionist painting in the style of Vincent van Gogh, thick impasto brushstrokes, swirling starry sky textures, vivid colors',
  monet: 'Impressionist oil painting by Claude Monet, soft lighting, dappled sunlight, peaceful atmospheric colors, painterly texture',
  watercolor: 'Delicate watercolor painting, transparent washes of color, soft bleeding edges, ethereal and light aesthetic',
  comic: 'Classic American comic book style, bold black outlines, pop art dots, vibrant flat colors, graphic novel illustration',
};

async function getDetailedCaption(photoUrl: string, token: string): Promise<string | null> {
  try {
    const photoResponse = await fetch(photoUrl, { signal: AbortSignal.timeout(12000) });
    if (!photoResponse.ok) return null;
    const buffer = await photoResponse.arrayBuffer();

    // Use BLIP-2 for more detailed and intelligent descriptions than standard BLIP
    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/Salesforce/blip2-opt-2.7b',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: buffer,
        signal: AbortSignal.timeout(20000),
      }
    );

    if (!hfResponse.ok) {
       // Fallback to BLIP Large if BLIP-2 is unavailable/loading
       const fallbackRes = await fetch(
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
       if (!fallbackRes.ok) return null;
       const fallbackData = await fallbackRes.json();
       return fallbackData[0]?.generated_text || null;
    }

    const result = await hfResponse.json();
    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text;
    }
    return null;
  } catch (err) {
    console.error("Detailed captioning failed:", err);
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
    const stylePrompt = styleGenPrompts[style as keyof typeof styleGenPrompts] ?? `a ${style} style artwork`;
    
    let imageDescription = "";
    if (HF_TOKEN) {
      const caption = await getDetailedCaption(photoUrl, HF_TOKEN);
      if (caption) {
        imageDescription = `The image features: ${caption}. `;
      }
    }

    // Comprehensive instruction for Pollinations to maintain semantic fidelity
    const finalPrompt = `${stylePrompt}. ${imageDescription} Maintain EXACT composition, subjects, accessories (glasses, hats, etc.), and placement from the original photo. High fidelity reproduction, highly detailed.`;
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    // Cloudinary optimization for the reference image
    let optimizedImageUrl = photoUrl;
    if (photoUrl.includes('res.cloudinary.com')) {
        optimizedImageUrl = photoUrl.replace('/upload/', '/upload/c_limit,w_800,h_800,q_auto:best/');
    }
    const encodedImage = encodeURIComponent(optimizedImageUrl);

    // Using model=flux for the highest quality Generative transfer
    const artisticUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImage}&width=1024&height=1024&model=flux&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

    return NextResponse.json({ artisticUrl });
    
  } catch (error: any) {
    console.error('Artistic style generation error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}



