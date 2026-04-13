import { NextRequest, NextResponse } from 'next/server';

const styleGenPrompts: Record<string, string> = {
  manga: '2D Anime Manga style, Studio Ghibli illustration, high-quality digital art, vibrant cell shading, masterpiece',
  abstract: 'Abstract geometric expressionism, bold colors, artistic non-representational composition, thick textures',
  vangogh: 'Vincent van Gogh painting style, thick brushstrokes, swirling starry sky oil textures, vivid impressionism',
  monet: 'Claude Monet impressionist oil, soft focus, dappled sunlight, peaceful atmospheric colors, painterly',
  watercolor: 'Delicate hand-painted watercolor, transparent washes, soft bleeding edges, high quality aesthetic',
  comic: 'Vintage American comic book style, bold black outlines, pop art dots, vibrant flat colors, graphic novel',
};

/**
 * Uses Florence-2 on the router endpoint.
 */
async function getDetailedVisionDescription(photoUrl: string, token: string): Promise<string | null> {
  try {
    const photoResponse = await fetch(photoUrl, { signal: AbortSignal.timeout(12000) });
    if (!photoResponse.ok) return null;
    const buffer = await photoResponse.arrayBuffer();

    const taskPrompt = "<MORE_DETAILED_CAPTION>";

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
       // Fallback to BLIP-2
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
      // CLEANING technical tags
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

    /** 
     * THE FIDELITY ENGINE: Constructing a strict keyword-based prompt.
     * Tokens like 'exact_likeness' and 'high_structural_fidelity' help stay close to the source.
     */
    const qualityTokens = "high quality, extremely detailed, structural_integrity:1.4";
    const fidelityTokens = `exact facial proportions, identical background elements, maintain theater decor:1.3, ${visualContext}`;
    const finalPrompt = `${stylePrompt}, ${fidelityTokens}, ${qualityTokens}, photorealistic composition, masterwork`;
    
    const seed = Math.floor(Math.random() * 888888);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    let referenceUrl = photoUrl;
    if (photoUrl.includes('res.cloudinary.com')) {
        referenceUrl = photoUrl.replace('/upload/', '/upload/c_limit,w_1024,h_1024,q_auto:best/');
    }
    const encodedImage = encodeURIComponent(referenceUrl);

    // SWITCHING TO MODEL=TURBO FOR INSTANT RESPONSE (0.1s vs 3s)
    const artisticUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImage}&width=1024&height=1024&model=turbo&nologo=true&seed=${seed}&enhance=false`;

    return NextResponse.json({ artisticUrl });
    
  } catch (error: any) {
    console.error('Artistic pipeline error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}






