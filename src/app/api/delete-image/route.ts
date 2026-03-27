
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to extract public_id from a Cloudinary URL
const getPublicIdFromUrl = (url: string) => {
    try {
        const parts = url.split('/');
        const versionIndex = parts.findIndex(part => part.startsWith('v'));
        if (versionIndex === -1) return null;
        
        const publicIdWithExtension = parts.slice(versionIndex + 1).join('/');
        const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
        return publicId;
    } catch (error) {
        console.error("Error extracting public ID:", error);
        return null;
    }
}


export async function POST(request: Request) {
  try {
    const { resources } = await request.json(); // Array of { url: string, type: 'image' | 'video' }

    if (!Array.isArray(resources) || resources.length === 0) {
      return NextResponse.json({ error: "No resources provided." }, { status: 400 });
    }

    const results = [];
    
    // Group public IDs by resource type
    const resourcesByType = resources.reduce((acc, res) => {
      const publicId = getPublicIdFromUrl(res.url);
      if (publicId) {
        const type = res.type || 'image';
        if (!acc[type]) acc[type] = [];
        acc[type].push(publicId);
      }
      return acc;
    }, {} as Record<string, string[]>);

    // Perform deletions for each group
    for (const [type, publicIds] of Object.entries(resourcesByType)) {
      if ((publicIds as string[]).length > 0) {
        const result = await cloudinary.api.delete_resources(publicIds as string[], { resource_type: type as any });
        results.push({ type, result });
      }
    }

    return NextResponse.json({ message: 'Deletion completed', results });

  } catch (error) {
    console.error('Deletion Error:', error);
    return NextResponse.json({ message: 'Deletion failed' }, { status: 500 });
  }
}
