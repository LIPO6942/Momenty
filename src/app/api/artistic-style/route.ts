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
    const { photoUrl, style, width, height } = await req.json();
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
    const stylePrompt = styleGenPrompts[style as keyof typeof styleGenPrompts] ?? `in ${style} style`;
    
    let visualContext = "";
    if (HF_TOKEN) {
      const description = await getDetailedVisionDescription(photoUrl, HF_TOKEN);
      if (description) {
        visualContext = description;
      }
    }

    /** 
     * SUBJECT-FIRST FIDELITY PROMPT
     * We anchor the model on the subject first to avoid style hallucinations (like Van Gogh's face).
     */
    const qualityTokens = "high quality, extremely detailed masterpiece, photorealistic composition";
    const subjectPrefix = `A faithful artistic depiction of the people and scene from the original photo: ${visualContext}.`;
    const constraints = "Maintain exact facial features and theater decor. Do NOT change the subjects identity.";
    const finalPrompt = `${subjectPrefix} Style: ${stylePrompt}. Constraints: ${constraints}. Quality: ${qualityTokens}.`;
    
    const seed = Math.floor(Math.random() * 888888);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    let referenceUrl = photoUrl;
    if (photoUrl.includes('res.cloudinary.com')) {
        referenceUrl = photoUrl.replace('/upload/', `/upload/c_limit,w_${targetWidth},h_${targetHeight},q_auto:best/`);
    }
    const encodedImage = encodeURIComponent(referenceUrl);

    const pollinationUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImage}&width=${targetWidth}&height=${targetHeight}&model=turbo&nologo=true&seed=${seed}&enhance=false`;

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







