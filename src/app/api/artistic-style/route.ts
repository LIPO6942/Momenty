import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Prompts optimisés pour instruct-pix2pix (instructions directes)
const styleInstructions: Record<string, string> = {
  vangogh:
    'Transform this photo into a Van Gogh painting with swirling brushstrokes, thick impasto paint, vivid yellows and blues, post-impressionist style',
  monet:
    'Transform this photo into a Claude Monet impressionist painting with soft loose brushstrokes, dappled light, pastel colors, painterly texture',
  abstract:
    'Transform this photo into an abstract expressionist painting with bold geometric shapes, vivid contrast colors, non-representational style',
  cubist:
    'Transform this photo into a Picasso cubist painting with geometric fragmentation, multiple simultaneous perspectives, flat angular shapes',
  oil:
    'Transform this photo into a classical oil painting with rich textures, deep shadows, luminous highlights, old masters technique',
  watercolor:
    'Transform this photo into a watercolor painting with transparent washes, soft bleeding edges, delicate light colors, wet-on-wet technique',
  'line art':
    'Transform this photo into a black and white line art illustration with clean sharp ink lines, minimalist contour drawing style',
  comic:
    'Transform this photo into a comic book illustration with bold black outlines, flat vivid colors, Ben-Day dots shading, pop art style',
  cyberpunk:
    'Transform this photo into a cyberpunk digital artwork with neon glow effects, futuristic atmosphere, electric blues and purples, dystopian lighting',
  fantasy:
    'Transform this photo into a fantasy digital painting with magical ethereal lighting, dramatic atmosphere, rich colors, detailed illustrative style',
  renaissance:
    'Transform this photo into a Renaissance painting with chiaroscuro lighting, sfumato technique, classical composition, warm earthy tones',
  ukiyoe:
    'Transform this photo into a Japanese ukiyo-e woodblock print with flat areas of color, bold outlines, traditional Japanese artistic style',
};

// HuggingFace model primary + fallback
const HF_MODEL_PRIMARY = 'timbrooks/instruct-pix2pix';
const HF_MODEL_FALLBACK = 'lllyasviel/sd-controlnet-scribble'; // fallback si primary indisponible

async function callHuggingFace(
  imageBuffer: Buffer,
  prompt: string,
  token: string,
  modelId: string
): Promise<Buffer | null> {
  const base64Image = imageBuffer.toString('base64');

  const response = await fetch(
    `https://api-inference.huggingface.co/models/${modelId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-use-cache': 'false',
      },
      body: JSON.stringify({
        inputs: base64Image,
        parameters: {
          prompt,
          num_inference_steps: 20,
          image_guidance_scale: 1.5,
          guidance_scale: 7.5,
        },
      }),
      signal: AbortSignal.timeout(55000), // 55s max (Vercel Pro = 60s)
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error(`HuggingFace error (${modelId}):`, response.status, errText);
    return null;
  }

  const arrayBuf = await response.arrayBuffer();
  return Buffer.from(arrayBuf);
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
      return NextResponse.json(
        { error: 'photoUrl and style are required' },
        { status: 400 }
      );
    }

    const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
    if (!HF_TOKEN) {
      return NextResponse.json(
        { error: 'HuggingFace token not configured on server' },
        { status: 500 }
      );
    }

    const prompt = styleInstructions[style] ?? styleInstructions.vangogh;

    // 1. Télécharger la photo originale
    const photoResponse = await fetch(photoUrl, {
      signal: AbortSignal.timeout(15000),
    });
    if (!photoResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch original photo' },
        { status: 400 }
      );
    }
    const photoBuffer = Buffer.from(await photoResponse.arrayBuffer());

    // 2. Appeler HuggingFace (primary model)
    let resultBuffer = await callHuggingFace(
      photoBuffer,
      prompt,
      HF_TOKEN,
      HF_MODEL_PRIMARY
    );

    // 3. Si le modèle primaire est en cours de chargement (cold start), renvoyer 503 avec retryAfter
    if (!resultBuffer) {
      return NextResponse.json(
        {
          error: 'model_loading',
          message:
            "Le modèle IA est en cours de démarrage (cold start). Réessaie dans 30 secondes.",
        },
        { status: 503 }
      );
    }

    // 4. Upload du résultat sur Cloudinary
    const cloudinaryUrl = await uploadBufferToCloudinary(resultBuffer);
    if (!cloudinaryUrl) {
      return NextResponse.json(
        { error: 'Failed to upload result to Cloudinary' },
        { status: 500 }
      );
    }

    return NextResponse.json({ artisticUrl: cloudinaryUrl });
  } catch (error: any) {
    console.error('Artistic style error:', error);

    if (error?.name === 'TimeoutError') {
      return NextResponse.json(
        {
          error: 'timeout',
          message:
            "La génération a pris trop de temps. Réessaie, le modèle est maintenant chargé.",
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
