/**
 * Helper utilities for client-side image compression, conversion, and upload.
 * Ensures images (from camera, HEIC, large files) never exceed body limits or fail uploads.
 */

export function dataURLtoBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

export function compressImage(
  file: File | Blob, 
  maxWidth: number = 1920, 
  quality: number = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // If file is already small (<600KB) and narrow enough, keep it directly
        if (file.size < 600 * 1024 && img.width <= maxWidth) {
          return resolve(event.target?.result as string);
        }

        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(event.target?.result as string);
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error("Impossible de décoder l'image pour la compression"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });
}

export async function uploadImageString(photoUrlOrData: string): Promise<string> {
  if (!photoUrlOrData) return photoUrlOrData;
  // If it's already an online URL (e.g. Cloudinary, https), return directly
  if (!photoUrlOrData.startsWith('data:')) {
    return photoUrlOrData;
  }

  const blob = dataURLtoBlob(photoUrlOrData);
  const formData = new FormData();
  formData.append('file', blob, 'photo.jpg');

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errMsg = `Échec de l'envoi de la photo (statut ${response.status})`;
    if (response.status === 413) {
      errMsg = "Photo trop volumineuse pour être envoyée.";
    } else {
      try {
        const body = await response.json();
        if (body.message || body.error) errMsg = body.message || body.error;
      } catch {}
    }
    throw new Error(errMsg);
  }

  const result = await response.json();
  if (!result?.secure_url) {
    throw new Error("L'URL de la photo téléversée est manquante.");
  }

  return result.secure_url;
}

export async function uploadMultipleImages(photos: string[]): Promise<string[]> {
  if (!photos || photos.length === 0) return [];
  return Promise.all(photos.map(p => uploadImageString(p)));
}
