// DeepAI API client for artistic style transfer
// https://deepai.org/machine-learning-model/fast-style-transfer

export type DeepAIStyleKey = 
  | 'monet'           // Monet impressionist style
  | 'vangogh'         // Van Gogh style  
  | 'abstract'        // Abstract art
  | 'cubist'          // Cubist/Picasso style
  | 'oil'             // Oil painting
  | 'watercolor'      // Watercolor painting
  | 'line art'        // Line drawing
  | 'comic'           // Comic book style
  | 'cyberpunk'       // Cyberpunk futuristic
  | 'fantasy'         // Fantasy art
  | 'renaissance'     // Renaissance painting
  | 'ukiyoe';         // Japanese woodblock print

// Style names for DeepAI API
const deepAIStyleMap: Record<DeepAIStyleKey, string> = {
  monet: 'monet',
  vangogh: 'vangogh',
  abstract: 'abstract',
  cubist: 'cubist',
  oil: 'oil',
  watercolor: 'watercolor',
  'line art': 'line art',
  comic: 'comic',
  cyberpunk: 'cyberpunk',
  fantasy: 'fantasy',
  renaissance: 'renaissance',
  ukiyoe: 'ukiyoe',
};

// Human-readable labels with emojis
export const deepAIStyles: { key: DeepAIStyleKey; label: string; emoji: string }[] = [
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

// Generate artistic image using DeepAI
export async function generateArtisticImage(
  photoUrl: string,
  style: DeepAIStyleKey,
  apiKey: string
): Promise<string | null> {
  try {
    const styleName = deepAIStyleMap[style];
    
    const formData = new FormData();
    formData.append('content', photoUrl);
    formData.append('style', styleName);

    const response = await fetch('https://api.deepai.org/api/fast-style-transfer', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepAI API error:', errorText);
      throw new Error(`DeepAI API error: ${response.status}`);
    }

    const result = await response.json();
    
    // DeepAI returns the generated image URL
    if (result.output_url) {
      return result.output_url;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to generate artistic image:', error);
    return null;
  }
}

// Alternative: Use DeepAI's cartoonify for cartoon effect
export async function generateCartoonImage(
  photoUrl: string,
  apiKey: string
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('image', photoUrl);

    const response = await fetch('https://api.deepai.org/api/toonify', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepAI Toonify error:', errorText);
      throw new Error(`DeepAI API error: ${response.status}`);
    }

    const result = await response.json();
    return result.output_url || null;
  } catch (error) {
    console.error('Failed to generate cartoon image:', error);
    return null;
  }
}
