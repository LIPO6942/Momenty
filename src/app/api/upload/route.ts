
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Next.js App Router: set max execution time (body size limit is handled by the runtime)
export const maxDuration = 60;

async function buffer(readable: NodeJS.ReadableStream) {
    const chunks = [];
    for await (const chunk of readable) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}
  

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    const isAudio = file.type.startsWith('audio/') || file.name.match(/\.(webm|mp4|m4a|mp3|ogg)$/i);
    const options = isAudio 
      ? { resource_type: 'video' as const } 
      : { 
          resource_type: 'auto' as const,
          transformation: [
            { angle: "auto_right" },
            { quality: "auto:best" },
            { fetch_format: "auto" }
          ]
        };

    const stream = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          options,
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              return reject(error);
            }
            resolve(result);
          }
        );
        const readable = new Readable();
        readable._read = () => {};
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });

    return NextResponse.json(stream);

  } catch (error: any) {
    console.error('Upload Error:', error);
    const message = error?.message || 'Upload failed';
    return NextResponse.json({ message, error: String(error) }, { status: 500 });
  }
}
