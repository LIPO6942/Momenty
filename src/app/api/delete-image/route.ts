
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
    const { photoUrls } = await request.json();

    if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
      return NextResponse.json({ error: "No photo URLs provided." }, { status: 400 });
    }

    const publicIds = photoUrls.map(getPublicIdFromUrl).filter(Boolean);

    if (publicIds.length === 0) {
      return NextResponse.json({ message: 'No valid public IDs found to delete.' }, { status: 200 });
    }

    // Use destroy for deleting resources
    const result = await cloudinary.api.delete_resources(publicIds as string[], { resource_type: 'image' });

    return NextResponse.json({ message: 'Deletion successful', result });

  } catch (error) {
    console.error('Deletion Error:', error);
    return NextResponse.json({ message: 'Deletion failed' }, { status: 500 });
  }
}
