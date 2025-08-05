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
  description: z.string().describe('A detailed description of what is in the photo.'),
  location: z.string().describe('The location (city, country) where the photo was likely taken. Be as specific as possible. If unknown, leave empty.')
});
export type DescribePhotoOutput = z.infer<typeof DescribePhotoOutputSchema>;

export async function describePhoto(input: DescribePhotoInput): Promise<DescribePhotoOutput> {
  return describePhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'describePhotoPrompt',
  input: {schema: DescribePhotoInputSchema},
  output: {schema: DescribePhotoOutputSchema},
  prompt: `You are an expert travel assistant. Your task is to analyze the provided photo and extract meaningful information for a travel journal.

  Based on the image, provide a detailed description of the scene.
  
  Also, try to identify the location (city, country) where the photo might have been taken. Look for landmarks, text, architectural styles, or any other clues. If you can identify the location, provide it. If you are uncertain, leave the location field empty.

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
