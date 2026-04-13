import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const styleInstructions: Record<string, string> = {
  vangogh: 'A painting in the style of Van Gogh, impressionism, thick paint, expressive brush strokes',
  manga: 'High quality anime manga style illustration of this image, 2d shading, cel shading, detailed character design, studio ghibli, makoto shinkai style, masterpiece',
  monet: 'A painting in the style of Claude Monet, impressionism, serene, dappled light',
  abstract: 'An abstract geometric painting, vibrant colors, Picasso style',
  oil: 'A classical oil painting, renaissance lighting, masterful technique',
  watercolor: 'A delicate watercolor painting, soft bleeding colors, ethereal',
  'line art': 'A minimalist black and white line art drawing, clean lines',
  comic: 'An american comic book illustration, bold outlines, pop art',
  cyberpunk: 'A futuristic cyberpunk artwork, neon lights, glowing accents, dystopian',
  fantasy: 'A beautiful fantasy digital painting, magical lighting',
  renaissance: 'A classical Renaissance era oil painting, warm lighting, sfumato',
  ukiyoe: 'A traditional Japanese ukiyo-e woodblock print, flat colors',
};

const HF_MODEL = 'stabilityai/stable-diffusion-xl-refiner-1.0'; // Refiner works excellent for img2img
const FALLBACK_MODEL = 'runwayml/stable-diffusion-v1-5';

async function callHuggingFace(
  dataUri: string,
  prompt: string,
  token: string,
  modelId: string
): Promise<{ buffer?: Buffer; retryAfter?: boolean; error?: string }> {
  
  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${modelId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-use-cache': 'false',
      },
      body: JSON.stringify({
        inputs: dataUri,
        parameters: {
          prompt,
          strength: 0.65, // Retain original traits
          guidance_scale: 7.5,
          num_inference_steps: 25,
        },
      }),
      // Using a longer timeout for HF models
      signal: AbortSignal.timeout(58000),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error(`HuggingFace error (${modelId}):`, response.status, errText);
    if (response.status === 503) {
      return { retryAfter: true };
    }
    return { error: errText };
  }

  const arrayBuf = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuf) };
}

async function uploadBufferToCloudinary(buffer: Buffer): Promise<string | null> {
  return new Promise((resolve) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'momenty_artistic',
        resource_type: 'image',
        format: 'webp',
        quality: 'auto:good',
      },
      (error, result) => {
        if (error || !result) {
          console.error('Cloudinary upload error:', error);
          resolve(null);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    stream.end(buffer);
  });
}

export async function POST(req: NextRequest) {
  try {
    const { photoUrl, style } = await req.json();

    if (!photoUrl || !style) {
      return NextResponse.json({ error: 'photoUrl and style are required' }, { status: 400 });
    }

    const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
    if (!HF_TOKEN) {
      return NextResponse.json({ error: 'HuggingFace token not configured' }, { status: 500 });
    }

    const prompt = styleInstructions[style] ?? `Transform this image into ${style} style, preserving traits`;

    // 1. Download original
    const photoResponse = await fetch(photoUrl, { signal: AbortSignal.timeout(15000) });
    if (!photoResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch original photo' }, { status: 400 });
    }
    
    // Convert to proper base64 Data URI expected by newer HF img2img tasks
    const arrayBuffer = await photoResponse.arrayBuffer();
    const photoBuffer = Buffer.from(arrayBuffer);
    const mimeType = photoResponse.headers.get('content-type') || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${photoBuffer.toString('base64')}`;

    // 2. Call HuggingFace Main Model
    let hfRes = await callHuggingFace(dataUri, prompt, HF_TOKEN, HF_MODEL);
    
    // Fallback to SD 1.5 if Refiner is not accessible (404/Incompatible)
    if (hfRes.error && hfRes.error.includes("Not Found")) {
        console.log("Model not found, falling back to SD 1.5");
        hfRes = await callHuggingFace(dataUri, prompt, HF_TOKEN, FALLBACK_MODEL);
    }

    // 3. Handle errors & cold start
    if (hfRes.retryAfter) {
      return NextResponse.json(
        { error: 'model_loading', message: "Le modèle IA est en cours de chargement. Réessaie." },
        { status: 503 }
      );
    }
    
    if (hfRes.error) {
       return NextResponse.json(
        { error: 'hf_error', message: "L'IA HuggingFace a refusé la requête.", details: hfRes.error },
        { status: 500 }
      );
    }

    if (!hfRes.buffer) throw new Error("Empty buffer from HF");

    // 4. Upload to Cloudinary
    const cloudinaryUrl = await uploadBufferToCloudinary(hfRes.buffer);
    if (!cloudinaryUrl) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    return NextResponse.json({ artisticUrl: cloudinaryUrl });
    
  } catch (error: any) {
    console.error('Artistic style error:', error);
    if (error?.name === 'TimeoutError') {
      return NextResponse.json({ error: 'timeout', message: "L'IA met trop de temps. Réessaie." }, { status: 504 });
    }
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
