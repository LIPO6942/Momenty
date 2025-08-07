'use server';
/**
 * @fileOverview An AI flow to improve a description.
 *
 * - improveDescription - A function that handles the description improvement process.
 * - ImproveDescriptionInput - The input type for the improveDescription function.
 * - ImproveDescriptionOutput - The return type for the improveDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ImproveDescriptionInputSchema = z.object({
  description: z.string().describe('The description to improve.'),
});
export type ImproveDescriptionInput = z.infer<typeof ImproveDescriptionInputSchema>;

const ImproveDescriptionOutputSchema = z.object({
  improvedDescription: z.string().describe('The improved, poetic, and evocative description in French.'),
});
export type ImproveDescriptionOutput = z.infer<typeof ImproveDescriptionOutputSchema>;

export async function improveDescription(input: ImproveDescriptionInput): Promise<ImproveDescriptionOutput> {
  return improveDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'improveDescriptionPrompt',
  input: {schema: ImproveDescriptionInputSchema},
  output: {schema: ImproveDescriptionOutputSchema},
  prompt: `You are a talented and poetic travel writer. Your task is to rewrite the following description to make it more evocative, immersive, and engaging.
  
  The tone should be personal and inspiring. Transform simple notes into a captivating snippet of a travel journal. The language must be French.

  Original description:
  "{{{description}}}"
  
  Generate an improved description.`,
});

const improveDescriptionFlow = ai.defineFlow(
  {
    name: 'improveDescriptionFlow',
    inputSchema: ImproveDescriptionInputSchema,
    outputSchema: ImproveDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
