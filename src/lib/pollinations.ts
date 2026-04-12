// Pollinations.ai API client for AI image generation
// https://pollinations.ai - Free, no API key required, no rate limits

export type PollinationsStyleKey = 
  | 'monet'           // Impressionist style
  | 'vangogh'         // Van Gogh style  
  | 'abstract'        // Abstract art
  | 'cubist'          // Cubist style
  | 'oil'             // Oil painting
  | 'watercolor'      // Watercolor painting
  | 'line art'        // Line drawing
  | 'comic'           // Comic book style
  | 'cyberpunk'       // Cyberpunk futuristic
  | 'fantasy'         // Fantasy art
  | 'renaissance'     // Renaissance painting
  | 'ukiyoe';         // Japanese woodblock print

// Prompt prefixes for different styles
const stylePromptMap: Record<PollinationsStyleKey, string> = {
  monet: 'in the style of Claude Monet, impressionist painting, soft brushstrokes, vibrant colors, garden scene, oil painting',
  vangogh: 'in the style of Vincent van Gogh, post-impressionist, swirling brushstrokes, starry night texture, thick paint, oil on canvas',
  abstract: 'abstract art, geometric shapes, bold colors, modern art, non-representational, expressive brushwork',
  cubist: 'cubist style painting, Picasso style, geometric fragmentation, multiple perspectives, abstract forms',
  oil: 'oil painting style, rich textures, classical painting technique, canvas texture, masterful brushwork',
  watercolor: 'watercolor painting, soft washes, flowing colors, wet-on-wet technique, delicate and ethereal',
  'line art': 'line art drawing, clean black lines, minimalist illustration, ink drawing, contour drawing',
  comic: 'comic book style, bold outlines, vibrant colors, graphic novel illustration, pop art',
  cyberpunk: 'cyberpunk style, neon lights, futuristic city, high tech, dystopian, digital art, glowing elements',
  fantasy: 'fantasy art style, magical, ethereal lighting, detailed illustration, dreamlike atmosphere',
  renaissance: 'renaissance painting style, classical art, chiaroscuro lighting, oil painting, masterful technique',
  ukiyoe: 'ukiyo-e style, Japanese woodblock print, flat colors, bold outlines, traditional Japanese art',
};

// Human-readable labels with emojis
export const pollinationsStyles: { key: PollinationsStyleKey; label: string; emoji: string }[] = [
  { key: 'monet', label: 'Monet', emoji: '🌸' },
  { key: 'vangogh', label: 'Van Gogh', emoji: '🌻' },
  { key: 'abstract', label: 'Abstrait', emoji: '🎨' },
  { key: 'cubist', label: 'Cubiste', emoji: '🎭' },
  { key: 'oil', label: 'Huile', emoji: '🖼️' },
  { key: 'watercolor', label: 'Aquarelle', emoji: '💧' },
  { key: 'line art', label: 'Dessin', emoji: '✏️' },
  { key: 'comic', label: 'Comic', emoji: '💥' },
  { key: 'cyberpunk', label: 'Cyberpunk', emoji: '🤖' },
  { key: 'fantasy', label: 'Fantasy', emoji: '🐉' },
  { key: 'renaissance', label: 'Renaissance', emoji: '🏛️' },
  { key: 'ukiyoe', label: 'Ukiyo-e', emoji: '🗾' },
];

// Generate artistic image using Pollinations.ai
// Uses prompt-based generation with reference image
export function generatePollinationsArtisticUrl(
  photoUrl: string,
  style: PollinationsStyleKey
): string {
  const stylePrompt = stylePromptMap[style];
  
  // Use Pollinations.ai image reference feature with shorter prompt
  // The 'image' parameter tells Pollinations to use the source as reference
  const prompt = `artistic photo, ${stylePrompt}, masterpiece`;
  
  const encodedPrompt = encodeURIComponent(prompt);
  // Use the original photo URL as reference image
  const encodedImage = encodeURIComponent(photoUrl);
  
  // Generate URL with proper parameters for image-to-image
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?image=${encodedImage}&width=1024&height=1024&seed=42&nologo=true`;
  
  return url;
}

// Alternative: Use pollinations for pure text-to-image (if no source photo provided)
export function generatePollinationsUrlFromPrompt(
  description: string,
  style: PollinationsStyleKey
): string {
  const stylePrompt = stylePromptMap[style];
  const prompt = `${description}, ${stylePrompt}, high quality, detailed, artistic masterpiece`;
  
  const encodedPrompt = encodeURIComponent(prompt);
  
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=42&enhance=true`;
}
