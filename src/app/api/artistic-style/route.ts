import { NextRequest, NextResponse } from 'next/server';

const styleGenPrompts: Record<string, string> = {
  manga: '2D Anime Manga style, professional digital illustration, Studio Ghibli vibes, clean vibrant cell shading, masterpiece anime art',
  abstract: 'Abstract geometric expressionism, thick oil paint textures, bold vibrant primary colors, non-representational dynamic composition',
  vangogh: 'Vincent van Gogh painting style, thick impasto brushstrokes, swirling starry textures, vivid sunflowers colors, post-impressionism oil',
  monet: 'Claude Monet impressionist oil painting, soft focus, dappled sunshine, atmospheric lighting, painterly texture, visible brushstrokes',
  watercolor: 'Delicate hand-painted watercolor, transparent washy colors, soft bleeding edges, high quality artistic paper texture',
  comic: 'Vintage American comic book art, bold black outlines, pop art Ben-Day dots, vibrant primary colors, graphic novel ink style',
};

/**
 * Uses microsoft/Florence-2-large on the router endpoint.
 * Sanitizes output to remove technical tags.
 */
async function getDetailedVisionDescription(photoUrl: string, token: string): Promise<string | null> {
  try {
    const photoResponse = await fetch(photoUrl, { signal: AbortSignal.timeout(12000) });
    if (!photoResponse.ok) return null;
    const buffer = await photoResponse.arrayBuffer();

    const taskPrompt = "<MORE_DETAILED_CAPTION>";

    // Use the new router endpoint
    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/microsoft/Florence-2-large',
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
       console.warn("Florence-2 failed, falling back to BLIP-2...");
       const blip2Res = await fetch(
         'https://router.huggingface.co/hf-inference/models/Salesforce/blip2-opt-2.7b',
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
    if (Array.isArray(result) && result[0]?.generated_text) {
      // CLEANING: Remove tags like <TASK_TAG>, <loc_X>, etc.
      return result[0].generated_text.replace(/<[^>]*>/g, '').trim(); 
    }
    return null;
  } catch (err) {
    console.error("Artistic Vision Step failed:", err);
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
    const stylePrompt = styleGenPrompts[style as keyof typeof styleGenPrompts] ?? `in ${style} style`;
    
    let visualContext = "";
    if (HF_TOKEN) {
      const description = await getDetailedVisionDescription(photoUrl, HF_TOKEN);
      if (description) {
        visualContext = description;
      }
    }

    // THE ULTIMATE IMPERATIVE PROMPT: Force fidelity to structure and traits
    const finalPrompt = `${stylePrompt}. SCENE ANALYSIS: ${visualContext}. MANDATORY RULES: 1. Keep the EXACT physical traits of the people (faces, hair, clothes). 2. Maintain EXACT positioning (people on the left/right, background objects). 3. Preserve the specific DECOR and environment (theater seats, stage lights, balcony). 4. Zero modifications to the original composition. This is a stylization of an existing photo, NOT a new generation. High fidelity reproduction.`;
    
    const seed = Math.floor(Math.random() * 999999);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    let referenceUrl = photoUrl;
    if (photoUrl.includes('res.cloudinary.com')) {
        referenceUrl = photoUrl.replace('/upload/', '/upload/c_limit,w_1024,h_1024,q_auto:best/');
    }
    const encodedImage = encodeURIComponent(referenceUrl);

    // Using prowiz if flux is being flaky, or sticking to flux with enhanced parameters
    // We add a random seed to bust cache
    const artisticUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImage}&width=1024&height=1024&model=flux&nologo=true&seed=${seed}&enhance=false`;

    return NextResponse.json({ artisticUrl });
    
  } catch (error: any) {
    console.error('Artistic pipeline critical error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}





