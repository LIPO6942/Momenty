
'use server';
/**
 * @fileOverview An AI flow to generate a travel story from a day's instants.
 *
 * - generateStory - A function that handles the story generation process.
 * - GenerateStoryInput - The input type for the generateStory function.
 * - GenerateStoryOutput - The return type for the generateStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const InstantForStorySchema = z.object({
  title: z.string(),
  description: z.string(),
  location: z.string(),
  emotion: z.string(),
  photo: z.string().optional(),
});

const GenerateStoryInputSchema = z.object({
  day: z.string().describe("La date du jour pour l'histoire, ex: '20 juillet 2024'."),
  instants: z.array(InstantForStorySchema).describe("Une liste des moments (notes, photos) de la journée."),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const GenerateStoryOutputSchema = z.object({
  story: z.string().describe("L'histoire concise et narrative de la journée, formatée en Markdown."),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateStoryPrompt',
  input: {schema: GenerateStoryInputSchema},
  output: {schema: GenerateStoryOutputSchema},
  prompt: `Tu es un écrivain de voyage poétique et concis. Ta mission est de transformer une série de moments (notes, photos, émotions) d'une journée en un récit de voyage immersif, court et bien structuré.

Le récit doit être en français, ne doit pas dépasser 4 ou 5 paragraphes.

Voici les éléments de la journée du {{day}}:

{{#each instants}}
- Moment:
  - Titre: {{{title}}}
  - Description: {{{description}}}
  - Lieu: {{{location}}}
  - Émotion ressentie: {{{emotion}}}
  {{#if photo}}
  - (Il y a une photo associée à ce moment)
  {{/if}}
{{/each}}

Rédige une histoire fluide et captivante qui relie ces moments. Commence par une introduction qui plante le décor. Ensuite, décris les moments forts en t'inspirant des notes et des émotions. Termine par une conclusion qui résume le sentiment général de la journée.

Sois bref mais poétique. Le résultat doit être un texte unique et personnel.

Structure la réponse en Markdown, avec un titre principal pour l'histoire. Par exemple :

# Une journée à Tozeur

Le soleil se levait à peine, et déjà la chaleur promettait une journée intense...

...puis tu continues le récit...
`,
});

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
