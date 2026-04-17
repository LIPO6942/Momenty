import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const styleGenPrompts: Record<string, string> = {
  manga: '2D Anime Manga style, Studio Ghibli illustration, high-quality digital art, vibrant cell shading, masterpiece',
  abstract: 'Abstract geometric expressionism, bold colors, artistic non-representational composition, thick textures',
  vangogh: 'Vincent van Gogh painting style, thick brushstrokes, swirling starry sky oil textures, vivid impressionism',
  monet: 'Claude Monet impressionist oil, soft focus, dappled sunlight, peaceful atmospheric colors, painterly',
  watercolor: 'Delicate hand-painted watercolor, transparent washes, soft bleeding edges, high quality aesthetic',
  comic: 'Vintage American comic book style, bold black outlines, pop art dots, vibrant flat colors, graphic novel',
};

// Faithful mode prompts - stronger emphasis on subject preservation
const faithfulPrompts: Record<string, string> = {
  manga: "RECREATE the EXACT SAME image as manga anime style. MANDATORY: Keep the SAME people, SAME faces, SAME expressions, SAME poses, SAME clothing, SAME background, SAME objects, SAME scene layout. Only apply manga aesthetics: cel shading, clean ink lines, anime features. DO NOT change subjects. DO NOT alter composition.",
  comic: "RECREATE the EXACT SAME image as comic book style. MANDATORY: Keep the SAME people, SAME faces, SAME poses, SAME setting, SAME action, SAME background details. Only apply comic aesthetics: bold outlines, dynamic shading, vibrant colors. DO NOT change subjects. DO NOT alter composition.",
  watercolor: "RECREATE the EXACT SAME image as watercolor painting. MANDATORY: Keep the SAME people, SAME faces, SAME poses, SAME clothing, SAME background, SAME objects, SAME scene composition. Only apply watercolor aesthetics: soft washes, paper texture, fluid blends. DO NOT change subjects. DO NOT alter layout.",
  oil: "RECREATE the EXACT SAME image as oil painting. MANDATORY: Keep the SAME people, SAME faces, SAME expressions, SAME poses, SAME setting, SAME background, SAME objects. Only apply oil paint aesthetics: rich brushwork, canvas texture, classical technique. DO NOT change subjects. DO NOT alter composition.",
  sketch: "RECREATE the EXACT SAME image as pencil sketch. MANDATORY: Keep the SAME people, SAME faces, SAME poses, SAME clothing, SAME background, SAME objects, SAME scene layout. Only apply sketch aesthetics: graphite shading, cross-hatching, paper texture. DO NOT change subjects.",
  neon: "RECREATE the EXACT SAME image with neon cyberpunk lighting. MANDATORY: Keep the SAME people, SAME faces, SAME poses, SAME clothing, SAME scene composition, SAME objects. Only add: neon glow effects, futuristic lighting, cyberpunk atmosphere. DO NOT change subjects. DO NOT alter layout.",
  vintage: "RECREATE the EXACT SAME image as vintage photograph. MANDATORY: Keep the SAME people, SAME faces, SAME poses, SAME clothing, SAME background, SAME objects. Only apply: sepia tone, aged paper texture, vintage color grading. DO NOT change subjects.",
  "pop-art": "RECREATE the EXACT SAME image as pop art. MANDATORY: Keep the SAME people, SAME faces, SAME poses, SAME clothing, SAME background elements, SAME composition. Only apply: bold flat colors, halftone patterns, Warhol style. DO NOT change subjects.",
  minimal: "RECREATE the EXACT SAME image as minimalist line art. MANDATORY: Keep the SAME people, SAME poses, SAME clothing silhouettes, SAME scene composition, SAME background key elements. Only apply: simplified lines, minimal detail, clean aesthetic. DO NOT change subjects.",
  pixel: "RECREATE the EXACT SAME image as pixel art. MANDATORY: Keep the SAME people, SAME poses, SAME clothing, SAME background, SAME objects, SAME scene layout. Only apply: pixelated aesthetic, limited palette, retro 8-bit style. DO NOT change subjects."
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
       return null;
    }

    const result = await hfResponse.json();
    if (Array.isArray(result) && result[0]?.generated_text) {
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
    const { photoUrl, style, mode = 'creative', width, height } = await req.json();
    if (!photoUrl || !style) {
      return NextResponse.json({ error: 'photoUrl and style are required' }, { status: 400 });
    }

    // DIMENSION MANAGEMENT: Maintain aspect ratio, max 1024 on long edge
    let targetWidth = 1024;
    let targetHeight = 1024;
    
    if (width && height) {
      const ratio = width / height;
      if (width > height) {
        targetWidth = 1024;
        targetHeight = Math.round(1024 / ratio);
      } else {
        targetHeight = 1024;
        targetWidth = Math.round(1024 * ratio);
      }
    }

    const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
    
    // Select prompt based on mode
    const isFaithful = mode === 'faithful';
    const stylePrompt = isFaithful 
      ? faithfulPrompts[style as keyof typeof faithfulPrompts] 
      : styleGenPrompts[style as keyof typeof styleGenPrompts] ?? `in ${style} style`;
    
    let visualContext = "";
    if (HF_TOKEN) {
      const description = await getDetailedVisionDescription(photoUrl, HF_TOKEN);
      if (description) {
        visualContext = description;
      }
    }

    /** 
     * MODE-SPECIFIC PROMPT STRATEGY
     * - FAITHFUL: Strong constraints on subject preservation with detailed visual context
     * - CREATIVE: Freedom for artistic interpretation
     */
    let finalPrompt: string;
    
    if (isFaithful) {
      // Faithful mode: EXTREME emphasis on exact reproduction
      const strictConstraint = "ABSOLUTE REQUIREMENT: This MUST be the EXACT SAME image with ONLY style transformation applied. The people, their faces, their clothing, their poses, the background, the decor, the objects, the lighting direction, and the scene composition MUST remain IDENTICAL to the reference.";
      const forbidden = "FORBIDDEN: Adding new subjects, removing existing subjects, changing poses, altering facial features, modifying the background, moving objects, changing clothing, or any creative reinterpretation.";
      const subjectDetails = visualContext 
        ? `The reference photo shows EXACTLY: ${visualContext}. You MUST reproduce these EXACT SAME elements with ONLY the style transformation applied.`
        : "You are transforming the style ONLY. The subjects, scene, and composition MUST remain EXACTLY as in the reference.";
      
      finalPrompt = `${strictConstraint} ${subjectDetails} Transformation instructions: ${stylePrompt}. ${forbidden} REPEAT: Same people, same faces, same poses, same background, same objects - ONLY style changes.`;
    } else {
      // Creative mode: Current behavior with artistic freedom
      const qualityTokens = "high quality, extremely detailed masterpiece, photorealistic composition";
      const subjectPrefix = visualContext 
        ? `Artistic interpretation of: ${visualContext}.`
        : `Artistic transformation of the scene.`;
      
      finalPrompt = `${subjectPrefix} Style: ${stylePrompt}. Quality: ${qualityTokens}.`;
    }
    
    // Use different seeds and model settings based on mode
    const seed = Math.floor(Math.random() * 888888);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    let referenceUrl = photoUrl;
    if (photoUrl.includes('res.cloudinary.com')) {
        referenceUrl = photoUrl.replace('/upload/', `/upload/c_limit,w_${targetWidth},h_${targetHeight},q_auto:best/`);
    }
    const encodedImage = encodeURIComponent(referenceUrl);

    // Mode-specific parameters for better fidelity in faithful mode
    const enhanceParam = isFaithful ? 'true' : 'false';
    const pollinationUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImage}&width=${targetWidth}&height=${targetHeight}&model=turbo&nologo=true&seed=${seed}&enhance=${enhanceParam}`;

    // PERSISTENCE: Download from Pollinations and Upload to Cloudinary
    console.log("Fetching from Pollinations...");
    const imageResponse = await fetch(pollinationUrl);
    if (!imageResponse.ok) throw new Error("Failed to fetch from Pollinations");
    const imageBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);

    console.log("Uploading to Cloudinary...");
    const cloudinaryResponse: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            folder: 'artistic_versions',
            resource_type: 'image',
            transformation: [{ quality: "auto:best" }, { fetch_format: "auto" }]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        const readable = new Readable();
        readable._read = () => {};
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });

    const artisticUrl = cloudinaryResponse.secure_url;
    console.log("Persistence successful:", artisticUrl);

    return NextResponse.json({ artisticUrl });
    
  } catch (error: any) {
    console.error('Artistic pipeline error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}







