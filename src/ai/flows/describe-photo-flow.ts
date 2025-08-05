
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

const DescribePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DescribePhotoInput = z.infer<typeof DescribePhotoInputSchema>;

const DescribePhotoOutputSchema = z.object({
  description: z.string().describe('Une courte narration poétique et évocatrice en français sur la photo, dans le style d\'un journal de voyage. La narration doit capturer l\'atmosphère et l\'émotion du moment.'),
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
  prompt: `Tu es un écrivain et poète spécialisé dans les récits de voyage. Ta tâche est d'analyser la photo fournie et de générer une narration courte et évocatrice en français pour un journal de voyage.

  Au lieu de simplement décrire l'image, crée une histoire ou une ambiance qui capture l'essence du moment. Utilise un langage poétique. Par exemple : "Un moment de calme capturé dans une ruelle silencieuse. Les murs bleus reflètent la douceur de l’après-midi. À travers l’image, on sent le silence d’une ville figée dans le temps."

  Essaie également d'identifier le lieu (ville, pays) où la photo a pu être prise. Intègre ce lieu dans ta narration si possible. Si tu n'es pas sûr, laisse le champ "location" vide.

  Photo: {{media url=photoDataUri}}`,
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
