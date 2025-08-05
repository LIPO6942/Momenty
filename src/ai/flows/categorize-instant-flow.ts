'use server';
/**
 * @fileOverview An AI flow to categorize travel instants.
 *
 * - categorizeInstant - A function that handles the instant categorization process.
 * - CategorizeInstantInput - The input type for the categorizeInstant function.
 * - CategorizeInstantOutput - The return type for the categorizeInstant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const CategorizeInstantInputSchema = z.object({
  title: z.string().describe('The title of the instant.'),
  description: z.string().describe('The description of the instant.'),
});
export type CategorizeInstantInput = z.infer<typeof CategorizeInstantInputSchema>;

const CategorizeInstantOutputSchema = z.object({
    category: z.string().describe('A single category for the instant. Must be one of: Gastronomie, Culture, Nature, Shopping, Art, Sport, Détente, Voyage.'),
});
export type CategorizeInstantOutput = z.infer<typeof CategorizeInstantOutputSchema>;

export async function categorizeInstant(input: CategorizeInstantInput): Promise<CategorizeInstantOutput> {
  return categorizeInstantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeInstantPrompt',
  input: {schema: CategorizeInstantInputSchema},
  output: {schema: CategorizeInstantOutputSchema},
  prompt: `You are an expert travel journal assistant. Your task is to categorize an event based on its title and description.
  
  Choose the most appropriate category from the following list: Gastronomie, Culture, Nature, Shopping, Art, Sport, Détente, Voyage.

  Event Title: {{{title}}}
  Event Description: {{{description}}}
  
  Provide only the most relevant category.`,
});

const categorizeInstantFlow = ai.defineFlow(
  {
    name: 'categorizeInstantFlow',
    inputSchema: CategorizeInstantInputSchema,
    outputSchema: CategorizeInstantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
