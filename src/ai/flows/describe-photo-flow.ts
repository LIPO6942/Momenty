
'use server';
/**
 * @fileOverview An AI flow to describe a photo.
 *
 * - describePhoto - A function that handles the photo description process.
 * - DescribePhotoInput - The input type for the describePhoto function.
 * - DescribePhotoOutput - The return type for the describePhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {googleAI} from '@genkit-ai/googleai';

const DescribePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DescribePhotoInput = z.infer<typeof DescribePhotoInputSchema>;

const DescribePhotoOutputSchema = z.object({
  description: z.string().describe('Une légende courte, poétique et évocatrice pour la photo, en français, dans le style d\'un post pour les réseaux sociaux. La légende doit capturer l\'atmosphère et l\'émotion du moment en 1 ou 2 phrases. Par exemple : "Bleu intense et calme absolu. Se perdre dans les ruelles de Sidi Bou Said."'),
  location: z.string().describe('Le lieu (ville, pays) où la photo a probablement été prise. Si inconnu, laisser vide.')
});
export type DescribePhotoOutput = z.infer<typeof DescribePhotoOutputSchema>;

export async function describePhoto(input: DescribePhotoInput): Promise<DescribePhotoOutput> {
  return describePhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'describePhotoPrompt',
  input: {schema: DescribePhotoInputSchema},
  output: {schema: DescribePhotoOutputSchema},
  model: googleAI.model('gemini-1.5-flash-latest'),
  prompt: `Tu es un influenceur voyage talentueux. Ta tâche est d'analyser la photo fournie et de générer une légende courte et percutante en français pour un post sur les réseaux sociaux.

  La légende doit être poétique et capturer l'essence du moment en 1 ou 2 phrases maximum.

  Exemples de style :
  - "Un moment de calme capturé dans une ruelle silencieuse. Les murs bleus reflètent la douceur de l’après-midi."
  - "Perdu dans les souks, où chaque couleur raconte une histoire."
  - "Le silence du désert, juste avant que le soleil ne se couche. Magique."

  Identifie également le lieu (ville, pays) où la photo a pu être prise. Intègre-le dans ta narration si possible. Si tu n'es pas sûr, laisse le champ "location" vide.

  Photo: {{media url=photoDataUri}}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const describePhotoFlow = ai.defineFlow(
  {
    name: 'describePhotoFlow',
    inputSchema: DescribePhotoInputSchema,
    outputSchema: DescribePhotoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
