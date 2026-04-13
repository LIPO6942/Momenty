import { NextRequest, NextResponse } from 'next/server';

const styleGenPrompts: Record<string, string> = {
  manga: '2D Anime Manga style illustration, professional digital art, Studio Ghibli aesthetic, clean cell shading, masterpiece, vibrant anime character design',
  abstract: 'Abstract geometric expressionism, bold vibrant colors, non-representational composition, Picasso and Kandinsky inspiration, oil textures',
  vangogh: 'Post-impressionist oil painting style of Vincent van Gogh, thick impasto brushstrokes, swirling starry textures, vivid sunflowers color palette',
  monet: 'Classic Impressionist oil painting by Claude Monet, soft focus, dappled sunlight lighting, atmospheric scenery, visible brushstrokes',
  watercolor: 'Delicate watercolor painting, transparent washes of ethereal color, soft bleeding edges, high quality hand-painted aesthetic',
  comic: 'Classic American vintage comic book illustration, bold black ink outlines, pop art Ben-Day dots, vibrant primary colors, graphic novel style',
};

/**
 * Uses microsoft/Florence-2-large to get a hyper-detailed description of the photo.
 * This includes people traits, clothes, background, and positioning.
 */
async function getDetailedVisionDescription(photoUrl: string, token: string): Promise<string | null> {
  try {
    const photoResponse = await fetch(photoUrl, { signal: AbortSignal.timeout(12000) });
    if (!photoResponse.ok) return null;
    const buffer = await photoResponse.arrayBuffer();

    // Task prefix for Florence-2 to get a more detailed caption than standard BLIP
    const taskPrompt = "<MORE_DETAILED_CAPTION>";

    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/Florence-2-large',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-wait-for-model': 'true',
        },
        body: JSON.stringify({
          inputs: Buffer.from(buffer).toString('base64'),
          parameters: { task: taskPrompt }
        }),
        signal: AbortSignal.timeout(25000),
      }
    );

    if (!hfResponse.ok) {
       console.warn("Florence-2 unavailable, falling back to BLIP-2...");
       // Fallback to BLIP-2 if Florence is loading or failing
       const blip2Res = await fetch(
         'https://api-inference.huggingface.co/models/Salesforce/blip2-opt-2.7b',
         {
           method: 'POST',
           headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/octet-stream' },
           body: buffer,
           signal: AbortSignal.timeout(15000),
         }
       );
       if (!blip2Res.ok) return null;
       const blipData = await blip2Res.json();
       return blipData[0]?.generated_text || null;
    }

    const result = await hfResponse.json();
    // Florence usually returns [{ generated_text: "..." }] or specialized JSON
    if (Array.isArray(result) && result[0]?.generated_text) {
      return result[0].generated_text.replace(/<[^>]*>/g, '').trim(); 
    }
    return null;
  } catch (err) {
    console.error("Vision Step failed:", err);
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
    
    let visualContext = "";
    if (HF_TOKEN) {
      const description = await getDetailedVisionDescription(photoUrl, HF_TOKEN);
      if (description) {
        // We wrap carefully to ensure the generator knows these are structural facts
        visualContext = `The scene features: ${description}. `;
      }
    }

    // THE ULTIMATE PROMPT: Combining visual facts + style + structure constraint
    const finalPrompt = `${stylePrompt}. SUBJECTS DESCRIPTION: ${visualContext} IMPORTANT: This is a REPLICA. Maintain EXACT positioning of the people (man on the right, woman on the left), keep their specific physical traits, hair colors, and background scenery exactly as in the original photo. No hallucinations. High fidelity reproduction.`;
    
    // Random seed to allow variation if retrying
    const seed = Math.floor(Math.random() * 999999);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    // Cloudinary optimization: large but processed enough to be clear for the generator
    let referenceUrl = photoUrl;
    if (photoUrl.includes('res.cloudinary.com')) {
        referenceUrl = photoUrl.replace('/upload/', '/upload/c_limit,w_1024,h_1024,q_auto:best/');
    }
    const encodedImage = encodeURIComponent(referenceUrl);

    // Pollinations with FLUX model (Highest quality)
    const artisticUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImage}&width=1024&height=1024&model=flux&nologo=true&seed=${seed}&enhance=false`;

    return NextResponse.json({ artisticUrl });
    
  } catch (error: any) {
    console.error('Artistic pipeline error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}




